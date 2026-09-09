export type Product = {
  id: string;
  slug: string;
  name: string;
  bnName: string;
  category: "Sensory" | "Story" | "Educational";
  age: string;
  price: number;
  originalPrice?: number;
  stock: number;
  badge?: string;
  emoji: string;
  imageUrl?: string;
  description: string;
};

export const products: Product[] = [
  {
    id: "1",
    slug: "touch-feel-animals",
    name: "Touch & Feel Animals",
    bnName: "টাচ অ্যান্ড ফিল অ্যানিম্যালস",
    category: "Sensory",
    age: "3–5",
    price: 450,
    originalPrice: 520,
    stock: 12,
    badge: "Bestseller",
    emoji: "🦁",
    description:
      "A fun sensory book designed to help young children explore animals through touch and discovery.",
  },
  {
    id: "2",
    slug: "little-stories-big-dreams",
    name: "Little Stories, Big Dreams",
    bnName: "লিটল স্টোরিজ, বিগ ড্রিমস",
    category: "Story",
    age: "5–8",
    price: 380,
    stock: 9,
    badge: "New",
    emoji: "🌙",
    description:
      "A collection of imaginative stories created for curious young readers.",
  },
  {
    id: "3",
    slug: "my-first-science-book",
    name: "My First Science Book",
    bnName: "মাই ফার্স্ট সায়েন্স বুক",
    category: "Educational",
    age: "6–10",
    price: 550,
    originalPrice: 620,
    stock: 15,
    emoji: "🔬",
    description:
      "An easy and engaging introduction to science for young learners.",
  },
  {
    id: "4",
    slug: "numbers-shapes-colors",
    name: "Numbers, Shapes & Colors",
    bnName: "নাম্বারস, শেপস অ্যান্ড কালারস",
    category: "Educational",
    age: "3–6",
    price: 320,
    stock: 18,
    emoji: "🔺",
    description:
      "A colorful first-concepts book covering numbers, shapes and colors.",
  },
  {
    id: "5",
    slug: "jungle-adventure",
    name: "Jungle Adventure",
    bnName: "জঙ্গল অ্যাডভেঞ্চার",
    category: "Story",
    age: "4–8",
    price: 420,
    stock: 7,
    emoji: "🐼",
    description:
      "A fun and colorful adventure book for curious young readers.",
  },
  {
    id: "6",
    slug: "my-sensory-world",
    name: "My Sensory World",
    bnName: "মাই সেন্সরি ওয়ার্ল্ড",
    category: "Sensory",
    age: "3–5",
    price: 480,
    stock: 10,
    emoji: "✨",
    description:
      "A sensory learning experience designed for early childhood exploration.",
  },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}