import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import NewsletterSignup from "@/components/NewsletterSignup";
import BilingualText from "@/components/BilingualText";
import HomeHeroImages from "@/components/HomeHeroImages";
import {
  products,
} from "@/lib/products";

import {
  siteConfig,
} from "@/lib/config";

import {
  supabase,
} from "@/lib/supabase";

async function getSupabaseProducts() {
  if (!supabase) {
    return null;
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "products"
      )
      .select(
        `
        id,
        name,
        slug,
        category,
        age_min,
        age_max,
        price,
        discount_price,
        stock,
        description,
        image_url,
        product_type
        `
      )
      .eq(
        "is_active",
        true
      )
      .eq(
        "product_type",
        "book"
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      );

  if (error) {
    console.error(
      "Supabase home error:",
      error.message
    );

    return null;
  }

  return data;
}

export default async function Home() {
  const supabaseProducts =
    await getSupabaseProducts();

  const mappedSupabaseProducts =
    (
      supabaseProducts ??
      []
    ).map(
      (
        product
      ) => ({
        id:
          product.id,

        slug:
          product.slug,

        name:
          product.name,

        bnName:
          product.name,

        category:
          product.category as
            | "Sensory"
            | "Story"
            | "Educational",

        age:
          product.age_min !==
            null &&
          product.age_max !==
            null
            ? `${product.age_min}–${product.age_max}`
            : "All",

        price:
          product.discount_price ??
          product.price,

        originalPrice:
          product.discount_price !==
          null
            ? product.price
            : undefined,

        stock:
          product.stock,

        emoji:
          "📚",

        imageUrl:
          product.image_url ??
          undefined,

        description:
          product.description ??
          "",
      })
    );

  const homepageProducts =
    mappedSupabaseProducts.length >
    0
      ? mappedSupabaseProducts
      : products;

  return (
    <>
      <Header />

      <main>

        {/* =================================================
            HERO
        ================================================= */}

        <section className="hero section-shell">
          <div className="hero-copy">
            <div className="eyebrow">
              <BilingualText
                en="BOOKS FOR CURIOUS YOUNG MINDS"
                bn="কৌতূহলী ছোট্ট মনগুলোর জন্য বই"
              />
            </div>

            <h1>
              <BilingualText
                en="Small pages."
                bn="ছোট্ট পাতা।"
              />

              <br />

              <BilingualText
                en="Big imagination."
                bn="বিশাল কল্পনার জগৎ।"
              />
            </h1>

            <p>
              <BilingualText
                en="Thoughtfully selected sensory, story and educational books for young readers."
                bn="শিশু পাঠকদের জন্য যত্নসহকারে বাছাই করা সেন্সরি, গল্প ও শিক্ষামূলক বই।"
              />
            </p>

            <div className="hero-actions">
              <Link
                className="primary-button"
                href="/shop"
              >
                <BilingualText
                  en="Shop Books"
                  bn="বই কিনুন"
                />
              </Link>

              <Link
                className="secondary-button"
                href="/fashion"
              >
                <BilingualText
                  en="Shop Fashion"
                  bn="ফ্যাশন দেখুন"
                />
              </Link>
            </div>

            <div className="trust-row">
              <span>
                ✓{" "}
                <BilingualText
                  en="Bangladesh delivery"
                  bn="সারা বাংলাদেশে ডেলিভারি"
                />
              </span>

              <span>
                ✓{" "}
                <BilingualText
                  en="bKash & Bank Payment"
                  bn="বিকাশ ও ব্যাংক পেমেন্ট"
                />
              </span>

              <span>
                ✓{" "}
                <BilingualText
                  en="Parent-friendly shopping"
                  bn="অভিভাবক-বান্ধব কেনাকাটা"
                />
              </span>
            </div>
          </div>

          <div className="hero-art">
            <HomeHeroImages />

            <span className="sparkle sparkle-a">
              ✦
            </span>

            <span className="sparkle sparkle-b">
              ✷
            </span>
          </div>
        </section>

        {/* =================================================
            CATEGORY STRIP
        ================================================= */}

        <section className="section-shell category-strip">
          <Link href="/shop?category=Sensory">
            <span>
              🖐️
            </span>

            <strong>
              <BilingualText
                en="Sensory"
                bn="সেন্সরি"
              />
            </strong>

            <small>
              <BilingualText
                en="Touch, feel & discover"
                bn="স্পর্শ করুন, অনুভব করুন, আবিষ্কার করুন"
              />
            </small>
          </Link>

          <Link href="/shop?category=Story">
            <span>
              🌙
            </span>

            <strong>
              <BilingualText
                en="Story Books"
                bn="গল্পের বই"
              />
            </strong>

            <small>
              <BilingualText
                en="Imagine every night"
                bn="প্রতিটি রাতে নতুন কল্পনা"
              />
            </small>
          </Link>

          <Link href="/shop?category=Educational">
            <span>
              🧠
            </span>

            <strong>
              <BilingualText
                en="Educational"
                bn="শিক্ষামূলক"
              />
            </strong>

            <small>
              <BilingualText
                en="Learn through play"
                bn="খেলার ছলে শিখুন"
              />
            </small>
          </Link>

          <Link href="/shop">
            <span>
              🎁
            </span>

            <strong>
              <BilingualText
                en="All Books"
                bn="সব বই"
              />
            </strong>

            <small>
              <BilingualText
                en="Explore the collection"
                bn="পুরো সংগ্রহ দেখুন"
              />
            </small>
          </Link>
        </section>

        {/* =================================================
            POPULAR PRODUCTS
        ================================================= */}

        <section className="section-shell section-block">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                <BilingualText
                  en="HANDPICKED FOR JIPLANCE"
                  bn="JIPLANCE-এর বাছাই করা সংগ্রহ"
                />
              </div>

              <h2>
                <BilingualText
                  en="Popular right now"
                  bn="এখন জনপ্রিয়"
                />
              </h2>
            </div>

            <Link href="/shop">
              <BilingualText
                en="View all →"
                bn="সব দেখুন →"
              />
            </Link>
          </div>

          <div className="product-grid">
            {homepageProducts
              .slice(
                0,
                4
              )
              .map(
                (
                  product
                ) => (
                  <ProductCard
                    product={
                      product
                    }
                    key={
                      product.id
                    }
                  />
                )
              )}
          </div>
        </section>

        {/* =================================================
            WHY JIPLANCE
        ================================================= */}

        <section className="section-shell promise">
          <div>
            <div className="eyebrow">
              <BilingualText
                en="WHY JIPLANCE"
                bn="কেন JIPLANCE"
              />
            </div>

            <h2>
              <BilingualText
                en="Books chosen with childhood in mind."
                bn="শৈশবের কথা মাথায় রেখেই বাছাই করা বই।"
              />
            </h2>
          </div>

          <div className="promise-grid">
            <article>
              <span>
                01
              </span>

              <h3>
                <BilingualText
                  en="Age-appropriate"
                  bn="বয়স উপযোগী"
                />
              </h3>

              <p>
                <BilingualText
                  en="Clear age guidance helps parents pick confidently."
                  bn="স্পষ্ট বয়স নির্দেশনা অভিভাবকদের আত্মবিশ্বাসের সঙ্গে বই বেছে নিতে সাহায্য করে।"
                />
              </p>
            </article>

            <article>
              <span>
                02
              </span>

              <h3>
                <BilingualText
                  en="Learning + joy"
                  bn="শেখা + আনন্দ"
                />
              </h3>

              <p>
                <BilingualText
                  en="Products are organized around curiosity, storytelling and learning."
                  bn="কৌতূহল, গল্প ও শেখার অভিজ্ঞতাকে কেন্দ্র করে পণ্যগুলো সাজানো হয়েছে।"
                />
              </p>
            </article>

            <article>
              <span>
                03
              </span>

              <h3>
                <BilingualText
                  en="Local convenience"
                  bn="সহজ স্থানীয় সেবা"
                />
              </h3>

              <p>
                <BilingualText
                  en="Simple checkout, local payment options and Bangladesh-wide delivery."
                  bn="সহজ চেকআউট, স্থানীয় পেমেন্ট এবং সারা বাংলাদেশে ডেলিভারি।"
                />
              </p>
            </article>
          </div>
        </section>

        {/* =================================================
            FASHION
        ================================================= */}

        <section className="section-shell fashion-banner">
          <div>
            <div className="eyebrow">
              JIPLANCE FASHION
            </div>

            <h2>
              <BilingualText
                en="Fashion for every occasion"
                bn="প্রতিটি উপলক্ষের জন্য ফ্যাশন"
              />
            </h2>

            <p>
              <BilingualText
                en="Explore clothing and accessories from JIPLANCE Fashion."
                bn="JIPLANCE Fashion-এর পোশাক ও অ্যাক্সেসরিজের সংগ্রহ দেখুন।"
              />
            </p>
          </div>

          <Link
            className="primary-button"
            href="/fashion"
          >
            <BilingualText
              en="Shop Fashion"
              bn="ফ্যাশন দেখুন"
            />
          </Link>
        </section>

        {/* =================================================
            NEWSLETTER
        ================================================= */}

        <NewsletterSignup
          tagline={
            siteConfig.tagline
          }
        />
      </main>

      <Footer />
    </>
  );
}