import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envText = fs.readFileSync(".env.local", "utf8");

const getEnv = (name) => {
  const line = envText
    .split(/\r?\n/)
    .find((item) => item.startsWith(`${name}=`));

  return line
    ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "")
    : "";
};

const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");

const supabaseKey =
  getEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ||
  getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or public key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const { data, error } = await supabase
  .from("product_variants")
  .select("*")
  .limit(10);

if (error) {
  console.error("ERROR:", error.message);
  process.exit(1);
}

console.log("PRODUCT VARIANTS:");
console.dir(data, { depth: null });