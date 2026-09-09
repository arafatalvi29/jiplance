"use client";

import Link from "next/link";
import type { Product } from "@/lib/products";
import WishlistButton from "@/components/WishlistButton";

type ProductCardProps = {
  product: Product;
  featured?: boolean;
};

export default function ProductCard({
  product,
  featured = false,
}: ProductCardProps) {
  return (
    <article
      className={`product-card ${
        featured ? "product-card-featured" : ""
      }`}
    >
      <div className="product-visual">
        {product.badge && (
          <span className="product-badge">
            {product.badge}
          </span>
        )}

        <WishlistButton
          productId={product.id}
        />

        {product.imageUrl ? (
          <Link
            href={`/product/${product.slug}`}
            className="product-image-link"
          >
            <img
              src={product.imageUrl}
              alt={product.name}
              className="product-card-image"
            />
          </Link>
        ) : (
          <Link
            href={`/product/${product.slug}`}
            className="product-image-link product-image-fallback"
          >
            <span className="product-emoji">
              {product.emoji}
            </span>
          </Link>
        )}
      </div>

      <div className="product-copy">
        <div className="eyebrow product-card-eyebrow">
          {product.category}
          {product.age &&
          product.age !== "All"
            ? ` • Age ${product.age}`
            : ""}
        </div>

        <Link
          href={`/product/${product.slug}`}
          className="product-name"
        >
          {product.name}
        </Link>

        <div className="price-row">
          <strong>
            ৳{product.price}
          </strong>

          {product.originalPrice && (
            <del>
              ৳{product.originalPrice}
            </del>
          )}
        </div>
      </div>
    </article>
  );
}