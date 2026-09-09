"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/components/LanguageProvider";
import { siteConfig } from "@/lib/config";
import { supabase } from "@/lib/supabase";

type PaymentMethod =
  | "bKash"
  | "Nagad"
  | "Bank";

type CartItem = {
  id: string;
  qty: number;

  variantId?: string | null;
  size?: string | null;
  color?: string | null;
};

type Product = {
  id: string;
  name: string;
  category: string | null;
  product_type: string | null;
  age_min: number | null;
  age_max: number | null;

  price: number;
  discount_price: number | null;

  stock: number;
};

type Variant = {
  id: string;
  product_id: string;

  size: string | null;
  color: string | null;

  stock: number;

  price: number | null;
  discount_price: number | null;

  is_active: boolean;
};

type CheckoutLine = {
  key: string;

  cartItem: CartItem;
  product: Product;
  variant: Variant | null;

  qty: number;
  sellingPrice: number;
  availableStock: number;

  size: string | null;
  color: string | null;
};

type PaymentSettings = {
  id: number;

  bkash_enabled: boolean;
  bkash_number: string | null;
  bkash_account_type: string | null;

  nagad_enabled: boolean;
  nagad_number: string | null;
  nagad_account_type: string | null;

  bank_enabled: boolean;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_branch: string | null;
  bank_routing_number: string | null;
};

type AppliedCoupon = {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
  subtotalBeforeDiscount: number;
  eligibleSubtotal: number;
  subtotalAfterDiscount: number;
  scopeType: "all" | "books" | "fashion" | "category";
  scopeName: string;
  message: string;
};


type CheckoutLanguage = "en" | "bn";

const checkoutMessageTranslations: Record<string, string> = {
  "Could not load payment information. Please refresh the page.":
    "পেমেন্ট তথ্য লোড করা যায়নি। পেজটি রিফ্রেশ করুন।",
  "Checkout service is unavailable right now.":
    "চেকআউট সেবা এই মুহূর্তে পাওয়া যাচ্ছে না।",
  "Could not load checkout products. Please refresh the page.":
    "চেকআউটের পণ্যগুলো লোড করা যায়নি। পেজটি রিফ্রেশ করুন।",
  "Could not load selected size/color information.":
    "নির্বাচিত Size/Color তথ্য লোড করা যায়নি।",
  "Coupon service is unavailable right now.":
    "কুপন সেবা এই মুহূর্তে পাওয়া যাচ্ছে না।",
  "Enter a coupon code first.":
    "প্রথমে একটি কুপন কোড লিখুন।",
  "Your cart is empty.":
    "আপনার কার্ট খালি।",
  "Could not validate this coupon.":
    "কুপনটি যাচাই করা যায়নি।",
  "This coupon could not be applied.":
    "এই কুপনটি প্রয়োগ করা যায়নি।",
  "Coupon response was invalid. Please try again.":
    "কুপনের তথ্য সঠিক নয়। আবার চেষ্টা করুন।",
  "Could not apply this coupon.":
    "কুপনটি প্রয়োগ করা যায়নি।",
  "Payment screenshot must be JPG, PNG or WEBP.":
    "পেমেন্ট স্ক্রিনশট JPG, PNG অথবা WEBP হতে হবে।",
  "Payment screenshot must be 5 MB or smaller.":
    "পেমেন্ট স্ক্রিনশট ৫ MB বা তার কম হতে হবে।",
  "Payment proof service is unavailable.":
    "পেমেন্ট প্রুফ সেবা পাওয়া যাচ্ছে না।",
  "Could not prepare payment proof upload.":
    "পেমেন্ট প্রুফ আপলোড প্রস্তুত করা যায়নি।",
  "Could not upload payment screenshot.":
    "পেমেন্ট স্ক্রিনশট আপলোড করা যায়নি।",
  "Could not attach payment screenshot to the order.":
    "অর্ডারের সঙ্গে পেমেন্ট স্ক্রিনশট যুক্ত করা যায়নি।",
  "Payment screenshot uploaded successfully.":
    "পেমেন্ট স্ক্রিনশট সফলভাবে আপলোড হয়েছে।",
  "Screenshot upload failed. Please try again.":
    "স্ক্রিনশট আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।",
  "Your cart is empty. Please add a product first.":
    "আপনার কার্ট খালি। প্রথমে একটি পণ্য যোগ করুন।",
  "Payment information is unavailable. Please refresh the page.":
    "পেমেন্ট তথ্য পাওয়া যাচ্ছে না। পেজটি রিফ্রেশ করুন।",
  "Please enter your full name.":
    "আপনার পূর্ণ নাম লিখুন।",
  "Please enter your phone number.":
    "আপনার ফোন নম্বর লিখুন।",
  "Please enter your delivery address.":
    "আপনার ডেলিভারি ঠিকানা লিখুন।",
  "Please enter your bank transaction/reference number.":
    "আপনার ব্যাংক Transaction / Reference Number লিখুন।",
  "Please enter your payment transaction ID.":
    "আপনার Payment Transaction ID লিখুন।",
  "Please enter the amount you claim to have sent.":
    "আপনি যে পরিমাণ টাকা পাঠিয়েছেন বলে দাবি করছেন তা লিখুন।",
  "Amount Claimed Sent must be greater than 0.":
    "Amount Claimed Sent অবশ্যই ০-এর বেশি হতে হবে।",
  "Minimum Amount Claimed Sent is ৳60.":
    "সর্বনিম্ন Amount Claimed Sent হলো ৳60।",
  "Your cart contains an invalid quantity.":
    "আপনার কার্টে একটি ভুল পরিমাণ রয়েছে।",
  "Your coupon is no longer available. Please apply it again.":
    "আপনার কুপনটি আর ব্যবহারযোগ্য নয়। আবার প্রয়োগ করুন।",
  "Your coupon could not be used. Please review the coupon and try again.":
    "কুপনটি ব্যবহার করা যায়নি। কুপনটি যাচাই করে আবার চেষ্টা করুন।",
  "Could not place your order. Please try again.":
    "আপনার অর্ডার সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।",
  "Order could not be created. Please try again.":
    "অর্ডার তৈরি করা যায়নি। আবার চেষ্টা করুন।",
  "Your order was created, but the screenshot could not be uploaded. You can retry below.":
    "আপনার অর্ডার তৈরি হয়েছে, কিন্তু স্ক্রিনশট আপলোড হয়নি। নিচ থেকে আবার চেষ্টা করতে পারবেন।",
  "Something went wrong while placing your order.":
    "অর্ডার করার সময় একটি সমস্যা হয়েছে।",
};

function localizeCheckoutMessage(
  message: string,
  lang: CheckoutLanguage
) {
  if (!message || lang === "en") {
    return message;
  }

  const direct = checkoutMessageTranslations[message];

  if (direct) {
    return direct;
  }

  let match = message.match(
    /^You must send the full amount of ৳([0-9.]+)\.$/
  );

  if (match) {
    return `আপনাকে পুরো ৳${match[1]} পাঠাতে হবে।`;
  }

  match = message.match(
    /^Amount Claimed Sent cannot be more than the order total of ৳([0-9.]+)\.$/
  );

  if (match) {
    return `Amount Claimed Sent অর্ডারের মোট ৳${match[1]}-এর বেশি হতে পারবে না।`;
  }

  match = message.match(
    /^Your coupon changed the order total to ৳([0-9.]+)\. Please update Amount Claimed Sent\.$/
  );

  if (match) {
    return `কুপনের কারণে অর্ডারের মোট ৳${match[1]} হয়েছে। Amount Claimed Sent আপডেট করুন।`;
  }

  if (message.endsWith(" does not have enough stock.")) {
    return message.replace(
      " does not have enough stock.",
      "-এর পর্যাপ্ত স্টক নেই।"
    );
  }

  if (
    message.startsWith("The selected size/color for ") &&
    message.endsWith(" is no longer available.")
  ) {
    const name = message
      .replace("The selected size/color for ", "")
      .replace(" is no longer available.", "");

    return `${name}-এর নির্বাচিত Size/Color আর পাওয়া যাচ্ছে না।`;
  }

  return message;
}

export default function CheckoutPage() {
  const { lang } = useLanguage();

  const t = (en: string, bn: string) =>
    lang === "bn" ? bn : en;

  const [submitted, setSubmitted] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [
    paymentSettings,
    setPaymentSettings,
  ] =
    useState<PaymentSettings | null>(
      null
    );

  const [
    paymentSettingsLoading,
    setPaymentSettingsLoading,
  ] = useState(true);

  const [orderId, setOrderId] =
    useState("");

  const [
    createdOrderUuid,
    setCreatedOrderUuid,
  ] = useState("");

  const [
    confirmedSubtotal,
    setConfirmedSubtotal,
  ] = useState(0);

  const [
    confirmedDiscount,
    setConfirmedDiscount,
  ] = useState(0);

  const [
    confirmedCouponCode,
    setConfirmedCouponCode,
  ] = useState("");

  const [
    confirmedShipping,
    setConfirmedShipping,
  ] = useState(0);

  const [
    confirmedTotal,
    setConfirmedTotal,
  ] = useState(0);

  const [
    confirmedClaimedAmount,
    setConfirmedClaimedAmount,
  ] = useState(0);

  const [
    confirmedDueAmount,
    setConfirmedDueAmount,
  ] = useState(0);

  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [variants, setVariants] =
    useState<Variant[]>([]);

  const [zone, setZone] =
    useState<
      "dhaka" | "outsideDhaka"
    >("dhaka");

  const [
    customerName,
    setCustomerName,
  ] = useState("");

  const [phone, setPhone] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState<PaymentMethod>("bKash");

  const [
    transactionId,
    setTransactionId,
  ] = useState("");

  const [
    claimedAmount,
    setClaimedAmount,
  ] = useState("");

  const [
    paymentProof,
    setPaymentProof,
  ] = useState<File | null>(null);

  const [
    paymentProofPreview,
    setPaymentProofPreview,
  ] = useState("");

  const [
    paymentProofUploaded,
    setPaymentProofUploaded,
  ] = useState(false);

  const [
    proofUploadMessage,
    setProofUploadMessage,
  ] = useState("");

  const [
    retryingProof,
    setRetryingProof,
  ] = useState(false);

  const [
    copiedValue,
    setCopiedValue,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    couponCode,
    setCouponCode,
  ] = useState("");

  const [
    couponLoading,
    setCouponLoading,
  ] = useState(false);

  const [
    couponError,
    setCouponError,
  ] = useState("");

  const [
    couponSuccess,
    setCouponSuccess,
  ] = useState("");

  const [
    appliedCoupon,
    setAppliedCoupon,
  ] = useState<AppliedCoupon | null>(
    null
  );

  // ========================================================
  // PAYMENT SETTINGS
  // ========================================================

  useEffect(() => {
    const loadPaymentSettings =
      async () => {
        if (!supabase) {
          setPaymentSettingsLoading(
            false
          );

          return;
        }

        const {
          data,
          error,
        } = await supabase
          .from("payment_settings")
          .select(
            `
            id,
            bkash_enabled,
            bkash_number,
            bkash_account_type,
            nagad_enabled,
            nagad_number,
            nagad_account_type,
            bank_enabled,
            bank_name,
            bank_account_name,
            bank_account_number,
            bank_branch,
            bank_routing_number
            `
          )
          .eq("id", 1)
          .maybeSingle();

        if (error) {
          console.error(
            "Payment settings error:",
            error.message
          );

          setErrorMessage(
            "Could not load payment information. Please refresh the page."
          );
        } else if (data) {
          const settings =
            data as PaymentSettings;

          setPaymentSettings(
            settings
          );

          if (
            settings.bkash_enabled
          ) {
            setPaymentMethod(
              "bKash"
            );
          } else if (
            settings.bank_enabled
          ) {
            setPaymentMethod(
              "Bank"
            );
          } else if (
            settings.nagad_enabled
          ) {
            setPaymentMethod(
              "Nagad"
            );
          }
        }

        setPaymentSettingsLoading(
          false
        );
      };

    loadPaymentSettings();
  }, []);

  // ========================================================
  // CART + PRODUCTS
  // ========================================================

  useEffect(() => {
    const loadCheckout =
      async () => {
        let savedCart: CartItem[] =
          [];

        try {
          const raw =
            localStorage.getItem(
              "jiplance-cart"
            );

          const parsed = raw
            ? JSON.parse(raw)
            : [];

          savedCart =
            Array.isArray(parsed)
              ? parsed
              : [];

          setCart(savedCart);
        } catch {
          setCart([]);
          savedCart = [];
        }

        if (!supabase) {
          setErrorMessage(
            "Checkout service is unavailable right now."
          );

          setLoading(false);
          return;
        }

        if (
          savedCart.length === 0
        ) {
          setLoading(false);
          return;
        }

        const productIds =
          Array.from(
            new Set(
              savedCart.map(
                (item) =>
                  item.id
              )
            )
          );

        const variantIds =
          Array.from(
            new Set(
              savedCart
                .map(
                  (item) =>
                    item.variantId
                )
                .filter(
                  (
                    value
                  ): value is string =>
                    typeof value ===
                      "string" &&
                    value.length > 0
                )
            )
          );

        const {
          data: productData,
          error: productError,
        } = await supabase
          .from("products")
          .select(
            `
            id,
            name,
            category,
            product_type,
            age_min,
            age_max,
            price,
            discount_price,
            stock
            `
          )
          .in(
            "id",
            productIds
          )
          .eq(
            "is_active",
            true
          );

        if (productError) {
          console.error(
            "Checkout product error:",
            productError.message
          );

          setErrorMessage(
            "Could not load checkout products. Please refresh the page."
          );

          setLoading(false);
          return;
        }

        setProducts(
          (productData ??
            []) as Product[]
        );

        if (
          variantIds.length > 0
        ) {
          const {
            data: variantData,
            error:
              variantError,
          } = await supabase
            .from(
              "product_variants"
            )
            .select(
              `
              id,
              product_id,
              size,
              color,
              stock,
              price,
              discount_price,
              is_active
              `
            )
            .in(
              "id",
              variantIds
            );

          if (variantError) {
            console.error(
              "Checkout variant error:",
              variantError.message
            );

            setErrorMessage(
              "Could not load selected size/color information."
            );

            setVariants([]);
          } else {
            setVariants(
              (variantData ??
                []) as Variant[]
            );
          }
        }

        setLoading(false);
      };

    loadCheckout();
  }, []);

  // ========================================================
  // SCREENSHOT PREVIEW CLEANUP
  // ========================================================

  useEffect(() => {
    return () => {
      if (
        paymentProofPreview
      ) {
        URL.revokeObjectURL(
          paymentProofPreview
        );
      }
    };
  }, [
    paymentProofPreview,
  ]);

  // ========================================================
  // CART LINES
  // ========================================================

  const lines =
    useMemo<CheckoutLine[]>(
      () => {
        return cart
          .map((item) => {
            const product =
              products.find(
                (entry) =>
                  entry.id ===
                  item.id
              );

            if (!product) {
              return null;
            }

            const variant =
              item.variantId
                ? variants.find(
                    (entry) =>
                      entry.id ===
                        item.variantId &&
                      entry.product_id ===
                        product.id
                  ) ?? null
                : null;

            if (
              item.variantId &&
              (!variant ||
                !variant.is_active)
            ) {
              return null;
            }

            const sellingPrice =
              Number(
                variant
                  ?.discount_price ??
                  variant?.price ??
                  product.discount_price ??
                  product.price
              );

            const availableStock =
              variant
                ? Number(
                    variant.stock
                  )
                : Number(
                    product.stock
                  );

            return {
              key: `${
                product.id
              }:${
                variant?.id ??
                "base"
              }`,

              cartItem: item,
              product,
              variant,

              qty: Number(
                item.qty
              ),

              sellingPrice,
              availableStock,

              size:
                variant?.size ??
                item.size ??
                null,

              color:
                variant?.color ??
                item.color ??
                null,
            };
          })
          .filter(
            (
              line
            ): line is CheckoutLine =>
              line !== null
          );
      },
      [
        cart,
        products,
        variants,
      ]
    );

  const subtotal = useMemo(
    () =>
      lines.reduce(
        (sum, line) =>
          sum +
          line.sellingPrice *
            line.qty,
        0
      ),
    [lines]
  );

  const shipping =
    lines.length > 0
      ? Number(
          siteConfig.delivery[
            zone
          ]
        ) || 0
      : 0;

  const discountAmount =
    appliedCoupon
      ? Math.min(
          Number(
            appliedCoupon.discountAmount
          ) || 0,
          subtotal
        )
      : 0;

  const discountedSubtotal =
    Math.max(
      subtotal - discountAmount,
      0
    );

  const total =
    discountedSubtotal + shipping;

  const numericClaimedAmount =
    Number(
      claimedAmount || 0
    );

  const dueAmount =
    Math.max(
      total -
        numericClaimedAmount,
      0
    );

  const paymentPercentage =
    total > 0
      ? Math.min(
          Math.round(
            (numericClaimedAmount /
              total) *
              100
          ),
          100
        )
      : 0;

  const couponItems = useMemo(
    () =>
      lines.map((line) => ({
        id: line.product.id,
        qty: line.qty,
        variant_id:
          line.variant?.id ?? null,
      })),
    [lines]
  );

  // ========================================================
  // COUPON
  // ========================================================

  const applyCoupon = async () => {
    if (!supabase) {
      setCouponError(
        "Coupon service is unavailable right now."
      );

      return;
    }

    const cleanCode =
      couponCode
        .trim()
        .toUpperCase();

    setCouponError("");
    setCouponSuccess("");

    if (!cleanCode) {
      setAppliedCoupon(null);
      setCouponError(
        "Enter a coupon code first."
      );

      return;
    }

    if (subtotal <= 0) {
      setAppliedCoupon(null);
      setCouponError(
        "Your cart is empty."
      );

      return;
    }

    setCouponLoading(true);

    try {
      const {
        data,
        error,
      } = await supabase.rpc(
        "validate_coupon",
        {
          p_code: cleanCode,
          p_items: couponItems,
        }
      );

      if (error) {
        setAppliedCoupon(null);
        setCouponError(
          error.message ||
            "Could not validate this coupon."
        );

        return;
      }

      const result = data as
        | {
            valid?: boolean;
            message?: string;
            code?: string;
            discount_type?:
              | "percentage"
              | "fixed";
            discount_value?: number;
            discount_amount?: number;
            subtotal_before_discount?: number;
            eligible_subtotal?: number;
            subtotal_after_discount?: number;
            scope_type?:
              | "all"
              | "books"
              | "fashion"
              | "category";
            scope_name?: string;
          }
        | null;

      if (!result?.valid) {
        setAppliedCoupon(null);
        setCouponError(
          result?.message ||
            "This coupon could not be applied."
        );

        return;
      }

      const nextDiscount =
        Number(
          result.discount_amount ?? 0
        );

      const nextCode =
        String(
          result.code || cleanCode
        ).toUpperCase();

      const nextDiscountedSubtotal =
        Number(
          result.subtotal_after_discount ??
            Math.max(
              subtotal - nextDiscount,
              0
            )
        );

      if (
        !Number.isFinite(
          nextDiscount
        ) ||
        nextDiscount < 0 ||
        !Number.isFinite(
          nextDiscountedSubtotal
        )
      ) {
        setAppliedCoupon(null);
        setCouponError(
          "Coupon response was invalid. Please try again."
        );

        return;
      }

      setCouponCode(nextCode);

      setAppliedCoupon({
        code: nextCode,

        discountType:
          result.discount_type ===
          "fixed"
            ? "fixed"
            : "percentage",

        discountValue:
          Number(
            result.discount_value ?? 0
          ),

        discountAmount:
          Math.min(
            nextDiscount,
            subtotal
          ),

        subtotalBeforeDiscount:
          Number(
            result.subtotal_before_discount ??
              subtotal
          ),

        eligibleSubtotal:
          Number(
            result.eligible_subtotal ??
              subtotal
          ),

        subtotalAfterDiscount:
          Math.max(
            nextDiscountedSubtotal,
            0
          ),

        scopeType:
          result.scope_type === "books" ||
          result.scope_type === "fashion" ||
          result.scope_type === "category"
            ? result.scope_type
            : "all",

        scopeName:
          String(
            result.scope_name ||
              "All Products"
          ),

        message:
          result.message ||
          "Coupon applied successfully.",
      });

      setCouponSuccess(
        result.message ||
          "Coupon applied successfully."
      );

      const nextTotal =
        Math.max(
          nextDiscountedSubtotal +
            shipping,
          0
        );

      setClaimedAmount(
        (current) => {
          const currentAmount =
            Number(
              current || 0
            );

          if (
            currentAmount >
            nextTotal
          ) {
            return String(
              nextTotal
            );
          }

          return current;
        }
      );
    } catch (error) {
      const couponFailure =
        error as {
          message?: string;
        };

      setAppliedCoupon(null);

      setCouponError(
        couponFailure.message ||
          "Could not apply this coupon."
      );
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    setCouponSuccess("");
  };

  // ========================================================
  // COPY
  // ========================================================

  const copyText = async (
    value: string | null
  ) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(
        value
      );

      setCopiedValue(value);

      window.setTimeout(() => {
        setCopiedValue("");
      }, 1500);
    } catch {
      setCopiedValue("");
    }
  };

  // ========================================================
  // PAYMENT SCREENSHOT
  // ========================================================

  const handleProofChange = (
    file: File | null
  ) => {
    setErrorMessage("");

    if (!file) {
      setPaymentProof(null);

      if (
        paymentProofPreview
      ) {
        URL.revokeObjectURL(
          paymentProofPreview
        );
      }

      setPaymentProofPreview(
        ""
      );

      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setErrorMessage(
        "Payment screenshot must be JPG, PNG or WEBP."
      );

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setErrorMessage(
        "Payment screenshot must be 5 MB or smaller."
      );

      return;
    }

    if (
      paymentProofPreview
    ) {
      URL.revokeObjectURL(
        paymentProofPreview
      );
    }

    setPaymentProof(file);

    setPaymentProofPreview(
      URL.createObjectURL(file)
    );
  };

  const uploadPaymentProof =
    async (
      actualOrderId: string,
      actualPhone: string,
      file: File
    ) => {
      if (!supabase) {
        throw new Error(
          "Payment proof service is unavailable."
        );
      }

      const {
        data: tokenData,
        error: tokenError,
      } = await supabase.rpc(
        "prepare_guest_payment_proof",
        {
          p_order_id:
            actualOrderId,

          p_phone:
            actualPhone.trim(),
        }
      );

      if (
        tokenError ||
        !tokenData
      ) {
        throw new Error(
          tokenError?.message ||
            "Could not prepare payment proof upload."
        );
      }

      const token =
        String(tokenData);

      let extension =
        "jpg";

      if (
        file.type ===
        "image/png"
      ) {
        extension = "png";
      } else if (
        file.type ===
        "image/webp"
      ) {
        extension = "webp";
      }

      const path =
        `${actualOrderId}/${token}.${extension}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from(
          "payment-proofs"
        )
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType:
            file.type,
        });

      if (uploadError) {
        throw new Error(
          uploadError.message ||
            "Could not upload payment screenshot."
        );
      }

      const {
        error: attachError,
      } = await supabase.rpc(
        "attach_guest_payment_proof",
        {
          p_order_id:
            actualOrderId,

          p_phone:
            actualPhone.trim(),

          p_path: path,
        }
      );

      if (attachError) {
        throw new Error(
          attachError.message ||
            "Could not attach payment screenshot to the order."
        );
      }

      return true;
    };

  const retryProofUpload =
    async () => {
      if (
        !createdOrderUuid ||
        !paymentProof ||
        !phone
      ) {
        return;
      }

      setRetryingProof(true);
      setProofUploadMessage("");

      try {
        await uploadPaymentProof(
          createdOrderUuid,
          phone,
          paymentProof
        );

        setPaymentProofUploaded(
          true
        );

        setProofUploadMessage(
          "Payment screenshot uploaded successfully."
        );
      } catch (error) {
        const retryError =
          error as {
            message?: string;
          };

        setProofUploadMessage(
          retryError.message ||
            "Screenshot upload failed. Please try again."
        );
      } finally {
        setRetryingProof(
          false
        );
      }
    };

  // ========================================================
  // SUBMIT
  // ========================================================

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setErrorMessage("");
    setProofUploadMessage("");

    if (!supabase) {
      setErrorMessage(
        "Checkout service is unavailable right now."
      );

      return;
    }

    if (
      loading ||
      lines.length === 0
    ) {
      setErrorMessage(
        "Your cart is empty. Please add a product first."
      );

      return;
    }

    if (
      !paymentSettings
    ) {
      setErrorMessage(
        "Payment information is unavailable. Please refresh the page."
      );

      return;
    }

    if (
      !customerName.trim()
    ) {
      setErrorMessage(
        "Please enter your full name."
      );

      return;
    }

    if (!phone.trim()) {
      setErrorMessage(
        "Please enter your phone number."
      );

      return;
    }

    if (!address.trim()) {
      setErrorMessage(
        "Please enter your delivery address."
      );

      return;
    }

    if (
      !transactionId.trim()
    ) {
      setErrorMessage(
        paymentMethod ===
          "Bank"
          ? "Please enter your bank transaction/reference number."
          : "Please enter your payment transaction ID."
      );

      return;
    }

    if (
      !claimedAmount.trim() ||
      !Number.isFinite(
        numericClaimedAmount
      )
    ) {
      setErrorMessage(
        "Please enter the amount you claim to have sent."
      );

      return;
    }

    if (
      numericClaimedAmount <=
      0
    ) {
      setErrorMessage(
        "Amount Claimed Sent must be greater than 0."
      );

      return;
    }

    if (
      total >= 60 &&
      numericClaimedAmount <
        60
    ) {
      setErrorMessage(
        "Minimum Amount Claimed Sent is ৳60."
      );

      return;
    }

    if (
      total < 60 &&
      numericClaimedAmount <
        total
    ) {
      setErrorMessage(
        `You must send the full amount of ৳${total}.`
      );

      return;
    }

    if (
      numericClaimedAmount >
      total
    ) {
      setErrorMessage(
        `Amount Claimed Sent cannot be more than the order total of ৳${total}.`
      );

      return;
    }

    const invalidQuantity =
      lines.find(
        (line) =>
          !Number.isInteger(
            line.qty
          ) ||
          line.qty <= 0
      );

    if (
      invalidQuantity
    ) {
      setErrorMessage(
        "Your cart contains an invalid quantity."
      );

      return;
    }

    const outOfStock =
      lines.find(
        (line) =>
          line.qty >
            line.availableStock ||
          line.availableStock <=
            0
      );

    if (outOfStock) {
      const variantText = [
        outOfStock.size
          ? `Size ${outOfStock.size}`
          : null,

        outOfStock.color
          ? `Color ${outOfStock.color}`
          : null,
      ]
        .filter(Boolean)
        .join(", ");

      setErrorMessage(
        `${outOfStock.product.name}${
          variantText
            ? ` (${variantText})`
            : ""
        } does not have enough stock.`
      );

      return;
    }

    const invalidFashion =
      lines.find(
        (line) =>
          line.product
            .product_type ===
            "fashion" &&
          line.cartItem
            .variantId &&
          !line.variant
      );

    if (
      invalidFashion
    ) {
      setErrorMessage(
        `The selected size/color for ${invalidFashion.product.name} is no longer available.`
      );

      return;
    }

    let orderCouponCode =
      appliedCoupon?.code ?? null;

    let orderDiscountAmount =
      discountAmount;

    let orderTotal = total;

    let orderDueAmount =
      dueAmount;

    setSubmitting(true);

    try {
      /*
       * Refresh coupon immediately
       * before order creation.
       *
       * The database still performs
       * the final authoritative check
       * inside create_guest_order().
       */
      if (orderCouponCode) {
        const {
          data: couponCheckData,
          error: couponCheckError,
        } = await supabase.rpc(
          "validate_coupon",
          {
            p_code:
              orderCouponCode,
            p_items:
              couponItems,
          }
        );

        const couponCheck =
          couponCheckData as
            | {
                valid?: boolean;
                message?: string;
                code?: string;
                discount_type?:
                  | "percentage"
                  | "fixed";
                discount_value?: number;
                discount_amount?: number;
                subtotal_before_discount?: number;
                eligible_subtotal?: number;
                subtotal_after_discount?: number;
                scope_type?:
                  | "all"
                  | "books"
                  | "fashion"
                  | "category";
                scope_name?: string;
              }
            | null;

        if (
          couponCheckError ||
          !couponCheck?.valid
        ) {
          setAppliedCoupon(null);
          setCouponSuccess("");
          setCouponError(
            couponCheckError?.message ||
              couponCheck?.message ||
              "Your coupon is no longer available. Please apply it again."
          );

          setErrorMessage(
            couponCheckError?.message ||
              couponCheck?.message ||
              "Your coupon could not be used. Please review the coupon and try again."
          );

          return;
        }

        orderCouponCode =
          String(
            couponCheck.code ||
              orderCouponCode
          ).toUpperCase();

        orderDiscountAmount =
          Math.min(
            Number(
              couponCheck.discount_amount ??
                0
            ),
            subtotal
          );

        orderTotal =
          Math.max(
            subtotal -
              orderDiscountAmount +
              shipping,
            0
          );

        orderDueAmount =
          Math.max(
            orderTotal -
              numericClaimedAmount,
            0
          );

        if (
          numericClaimedAmount >
          orderTotal
        ) {
          setErrorMessage(
            `Your coupon changed the order total to ৳${orderTotal}. Please update Amount Claimed Sent.`
          );

          return;
        }

        if (
          orderTotal >= 60 &&
          numericClaimedAmount < 60
        ) {
          setErrorMessage(
            "Minimum Amount Claimed Sent is ৳60."
          );

          return;
        }

        if (
          orderTotal < 60 &&
          numericClaimedAmount <
            orderTotal
        ) {
          setErrorMessage(
            `You must send the full amount of ৳${orderTotal}.`
          );

          return;
        }

        setAppliedCoupon({
          code: orderCouponCode,

          discountType:
            couponCheck.discount_type ===
            "fixed"
              ? "fixed"
              : "percentage",

          discountValue:
            Number(
              couponCheck.discount_value ??
                0
            ),

          discountAmount:
            orderDiscountAmount,

          subtotalBeforeDiscount:
            Number(
              couponCheck.subtotal_before_discount ??
                subtotal
            ),

          eligibleSubtotal:
            Number(
              couponCheck.eligible_subtotal ??
                subtotal
            ),

          subtotalAfterDiscount:
            Math.max(
              Number(
                couponCheck.subtotal_after_discount ??
                  subtotal -
                    orderDiscountAmount
              ),
              0
            ),

          scopeType:
            couponCheck.scope_type === "books" ||
            couponCheck.scope_type === "fashion" ||
            couponCheck.scope_type === "category"
              ? couponCheck.scope_type
              : "all",

          scopeName:
            String(
              couponCheck.scope_name ||
                "All Products"
            ),

          message:
            couponCheck.message ||
            "Coupon applied successfully.",
        });
      }

      const orderItems =
        couponItems;

      const databaseDeliveryArea =
        zone === "outsideDhaka"
          ? "outside_dhaka"
          : "dhaka";

      const {
        data,
        error,
      } = await supabase.rpc(
        "create_guest_order",
        {
          p_customer_name:
            customerName.trim(),

          p_phone:
            phone.trim(),

          p_address:
            address.trim(),

          p_delivery_area:
            databaseDeliveryArea,

          p_payment_method:
            paymentMethod,

          p_transaction_id:
            transactionId.trim(),

          p_paid_amount:
            numericClaimedAmount,

          p_coupon_code:
            orderCouponCode,

          p_items:
            orderItems,
        }
      );
if (error) {
  console.error(
    "Order creation error:",
    error
  );

  setErrorMessage(
    error.message ||
      "Could not place your order. Please try again."
  );

  return;
}

      if (!data) {
        setErrorMessage(
          "Order could not be created. Please try again."
        );

        return;
      }

      const actualOrderId =
        String(data);

      setCreatedOrderUuid(
        actualOrderId
      );

      // ==============================================
      // PAYMENT SCREENSHOT
      // ==============================================

      let proofSuccess =
        false;

      if (paymentProof) {
        try {
          await uploadPaymentProof(
            actualOrderId,
            phone,
            paymentProof
          );

          proofSuccess = true;

          setPaymentProofUploaded(
            true
          );

          setProofUploadMessage(
            "Payment screenshot uploaded successfully."
          );
        } catch (
          proofError
        ) {
          const uploadError =
            proofError as {
              message?: string;
            };

          console.error(
            "Payment proof upload error:",
            uploadError
          );

          setPaymentProofUploaded(
            false
          );

          setProofUploadMessage(
            uploadError.message ||
              "Your order was created, but the screenshot could not be uploaded. You can retry below."
          );
        }
      } else {
        setPaymentProofUploaded(
          false
        );
      }

      const {
        data:
          displayOrderNumber,
        error:
          displayNumberError,
      } = await supabase.rpc(
        "get_order_display_number",
        {
          p_order_id:
            actualOrderId,
        }
      );

      if (
        displayNumberError
      ) {
        console.error(
          "Order number error:",
          displayNumberError.message
        );
      }

      const finalOrderNumber =
        displayOrderNumber ||
        actualOrderId;

      setOrderId(
        finalOrderNumber
      );

      if (
        typeof window !==
        "undefined"
      ) {
        sessionStorage.setItem(
          "jiplance-last-order-number",
          finalOrderNumber
        );

        sessionStorage.setItem(
          "jiplance-last-order-phone",
          phone.trim()
        );
      }

      setConfirmedSubtotal(
        subtotal
      );

      setConfirmedDiscount(
        orderDiscountAmount
      );

      setConfirmedCouponCode(
        orderCouponCode ?? ""
      );

      setConfirmedShipping(
        shipping
      );

      setConfirmedTotal(
        orderTotal
      );

      setConfirmedClaimedAmount(
        numericClaimedAmount
      );

      setConfirmedDueAmount(
        orderDueAmount
      );

      localStorage.removeItem(
        "jiplance-cart"
      );

      setCart([]);

      window.dispatchEvent(
        new Event(
          "jiplance-cart-updated"
        )
      );

      setSubmitted(true);

      if (
        paymentProof &&
        proofSuccess
      ) {
        setPaymentProofUploaded(
          true
        );
      }
    } catch (error) {
      console.error(
        "Unexpected checkout error:",
        error
      );

      setErrorMessage(
        "Something went wrong while placing your order."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================================
  // SUCCESS PAGE
  // ========================================================

  if (submitted) {
    return (
      <>
        <Header />

        <main className="section-shell page-space">
          <section className="payment-success-card">
            <div className="success-glow" />

            <div className="success-check">
              ✓
            </div>

            <div className="eyebrow">
            {t('ORDER RECEIVED', 'অর্ডার গ্রহণ করা হয়েছে')}
          </div>

            <h1>
            {t('Your order is in.', 'আপনার অর্ডারটি গ্রহণ করা হয়েছে।')}
          </h1>

            <p className="success-intro">
              {t("Thank you,", "ধন্যবাদ,")} {" "}
              <strong>
                {customerName}
              </strong>
              . {t(
                "Your order has been saved and is waiting for payment verification.",
                "আপনার অর্ডার সংরক্ষিত হয়েছে এবং পেমেন্ট যাচাইয়ের অপেক্ষায় আছে।"
              )}
            </p>

            <div className="success-details">
              {orderId && (
                <div>
                  <span>
            {t('Order ID', 'অর্ডার আইডি')}
          </span>

                  <strong>
                    {orderId}
                  </strong>
                </div>
              )}

              <div>
                <span>
            {t('Payment', 'পেমেন্ট')}
          </span>

                <strong>
                  {paymentMethod}
                </strong>
              </div>

              <div>
                <span>
            {t('Reference', 'রেফারেন্স')}
          </span>

                <strong>
                  {transactionId}
                </strong>
              </div>

              <div>
                <span>
            {t('Subtotal', 'পণ্যের মোট')}
          </span>

                <strong>
                  ৳
                  {
                    confirmedSubtotal
                  }
                </strong>
              </div>

              {confirmedCouponCode && (
                <div className="success-coupon-card">
                  <span>
            {t('Coupon', 'কুপন')}
          </span>

                  <strong>
                    {confirmedCouponCode}
                  </strong>
                </div>
              )}

              {confirmedDiscount > 0 && (
                <div className="success-coupon-card">
                  <span>
            {t('Coupon Saved', 'কুপনে সাশ্রয়')}
          </span>

                  <strong>
                    -৳
                    {confirmedDiscount}
                  </strong>
                </div>
              )}

              <div>
                <span>
            {t('Order Total', 'অর্ডারের মোট')}
          </span>

                <strong>
                  ৳
                  {
                    confirmedTotal
                  }
                </strong>
              </div>

              <div>
                <span>
            {t('Claimed Sent', 'পাঠানো দাবি')}
          </span>

                <strong>
                  ৳
                  {
                    confirmedClaimedAmount
                  }
                </strong>
              </div>

              <div>
                <span>
            {t('Due on Delivery', 'ডেলিভারির সময় বাকি')}
          </span>

                <strong>
                  ৳
                  {
                    confirmedDueAmount
                  }
                </strong>
              </div>
            </div>

            <div className="verification-card">
              <span className="verification-dot" />

              <div>
                <strong>
                  {t(
                    "Payment Status: Pending Verification",
                    "পেমেন্ট স্ট্যাটাস: যাচাইয়ের অপেক্ষায়"
                  )}
                </strong>

                <p>
                  {t(
                    "Our team will verify your payment before confirming the order.",
                    "অর্ডার নিশ্চিত করার আগে আমাদের টিম আপনার পেমেন্ট যাচাই করবে।"
                  )}
                </p>
              </div>
            </div>

            {paymentProof && (
              <div
                className={`proof-result ${
                  paymentProofUploaded
                    ? "success"
                    : "warning"
                }`}
              >
                <strong>
                  {paymentProofUploaded
                    ? t("✓ Payment screenshot received", "✓ পেমেন্ট স্ক্রিনশট পাওয়া গেছে")
                    : t("Screenshot upload needs attention", "স্ক্রিনশট আপলোডে সমস্যা হয়েছে")}
                </strong>

                {proofUploadMessage && (
                  <p>
                    {localizeCheckoutMessage(
                      proofUploadMessage,
                      lang
                    )}
                  </p>
                )}

                {!paymentProofUploaded &&
                  createdOrderUuid && (
                    <button
                      type="button"
                      className="retry-proof-button"
                      onClick={
                        retryProofUpload
                      }
                      disabled={
                        retryingProof
                      }
                    >
                      {retryingProof
                        ? t("Uploading...", "আপলোড হচ্ছে...")
                        : t("Retry Screenshot Upload", "স্ক্রিনশট আবার আপলোড করুন")}
                    </button>
                  )}
              </div>
            )}

            {confirmedDueAmount >
            0 ? (
              <p className="due-message">
                {t("Remaining", "বাকি")} {" "}
                <strong>
                  ৳
                  {
                    confirmedDueAmount
                  }
                </strong>{" "}
                {t(
                  "will be collected on delivery after payment verification.",
                  "পেমেন্ট যাচাইয়ের পর ডেলিভারির সময় নেওয়া হবে।"
                )}
              </p>
            ) : (
              <p className="due-message">
                {t(
                  "The full amount has been claimed as sent. Manual verification is still required.",
                  "সম্পূর্ণ টাকা পাঠানো হয়েছে বলে দাবি করা হয়েছে। তবুও ম্যানুয়াল যাচাই প্রয়োজন।"
                )}
              </p>
            )}

            <div className="success-actions">
              <a
                href={
                  orderId.startsWith(
                    "JIP-"
                  )
                    ? `/track-order?order=${encodeURIComponent(
                        orderId
                      )}`
                    : "/track-order"
                }
                className="primary-button"
              >
            {t('Track Your Order →', 'অর্ডার ট্র্যাক করুন →')}
          </a>

              <a
                href="/shop"
                className="ghost-button"
              >
            {t('Continue Shopping', 'শপিং চালিয়ে যান')}
          </a>
            </div>
          </section>
        </main>

        <Footer />

        <style jsx>{`
          .payment-success-card {
            position: relative;
            overflow: hidden;
            max-width: 850px;
            margin: 30px auto 80px;
            padding: 54px;
            border: 1px solid #e8e9ee;
            border-radius: 32px;
            background:
              linear-gradient(
                145deg,
                #ffffff,
                #fafbff
              );
            box-shadow:
              0 30px 80px
              rgba(
                29,
                38,
                70,
                0.09
              );
            animation:
              successEnter
              0.6s ease both;
          }

          .success-glow {
            position: absolute;
            top: -130px;
            right: -100px;
            width: 310px;
            height: 310px;
            border-radius: 50%;
            background:
              radial-gradient(
                circle,
                rgba(
                  79,
                  111,
                  255,
                  0.12
                ),
                transparent 70%
              );
            pointer-events: none;
          }

          .success-check {
            display: grid;
            place-items: center;
            width: 64px;
            height: 64px;
            margin-bottom: 22px;
            border-radius: 22px;
            background: #192443;
            color: white;
            font-size: 1.8rem;
            box-shadow:
              0 14px 30px
              rgba(
                25,
                36,
                67,
                0.18
              );
          }

          .payment-success-card
            h1 {
            margin: 8px 0 14px;
            color: #19203f;
            font-size:
              clamp(
                2.5rem,
                7vw,
                4.5rem
              );
            letter-spacing:
              -0.06em;
            line-height: 0.95;
          }

          .success-intro {
            max-width: 610px;
            color: #6f7689;
            line-height: 1.75;
          }

          .success-details {
            display: grid;
            grid-template-columns:
              repeat(
                3,
                minmax(0, 1fr)
              );
            gap: 12px;
            margin: 32px 0 20px;
          }

          .success-details
            div {
            padding: 17px;
            border: 1px solid
              #e8eaf0;
            border-radius: 17px;
            background: white;
          }

          .success-details
            span {
            display: block;
            margin-bottom: 5px;
            color: #9a9fac;
            font-size: 0.68rem;
            font-weight: 800;
            text-transform:
              uppercase;
            letter-spacing:
              0.07em;
          }

          .success-details
            strong {
            color: #252c49;
            overflow-wrap:
              anywhere;
          }

          .success-coupon-card {
            border-color:
              #dcebdd !important;
            background:
              linear-gradient(
                145deg,
                #f4fbf6,
                #ffffff
              ) !important;
            animation:
              couponSuccessPop
              0.45s ease both;
          }

          .success-coupon-card
            strong {
            color: #2f7549;
          }

          .verification-card {
            display: flex;
            gap: 13px;
            padding: 18px;
            border-radius: 17px;
            background: #f5f7fb;
          }

          .verification-dot {
            flex: 0 0 auto;
            width: 10px;
            height: 10px;
            margin-top: 6px;
            border-radius: 50%;
            background: #e3a62d;
            animation:
              pulseDot
              1.8s ease infinite;
          }

          .verification-card
            strong {
            color: #313850;
          }

          .verification-card p {
            margin: 4px 0 0;
            color: #767d8f;
            font-size: 0.82rem;
          }

          .proof-result {
            margin-top: 14px;
            padding: 16px;
            border-radius: 16px;
          }

          .proof-result.success {
            background: #eef9f2;
            color: #34734b;
          }

          .proof-result.warning {
            background: #fff7e8;
            color: #8b6416;
          }

          .proof-result p {
            margin:
              6px 0 0;
            line-height: 1.6;
            font-size: 0.82rem;
          }

          .retry-proof-button {
            margin-top: 10px;
            padding: 10px 14px;
            border: none;
            border-radius: 11px;
            background: #222d50;
            color: white;
            font-weight: 750;
            cursor: pointer;
          }

          .due-message {
            margin: 20px 0 0;
            color: #646c81;
            line-height: 1.7;
          }

          .success-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 11px;
            margin-top: 28px;
          }

          @keyframes successEnter {
            from {
              opacity: 0;
              transform:
                translateY(18px);
            }

            to {
              opacity: 1;
              transform:
                translateY(0);
            }
          }

          @keyframes couponSuccessPop {
            from {
              opacity: 0;
              transform:
                scale(0.96)
                translateY(6px);
            }

            to {
              opacity: 1;
              transform:
                scale(1)
                translateY(0);
            }
          }

          @keyframes pulseDot {
            50% {
              transform:
                scale(1.45);
              opacity: 0.6;
            }
          }

          @media (
            max-width: 700px
          ) {
            .payment-success-card {
              padding: 30px 20px;
              border-radius: 24px;
            }

            .success-details {
              grid-template-columns:
                repeat(
                  2,
                  minmax(
                    0,
                    1fr
                  )
                );
            }
          }

          @media (
            max-width: 460px
          ) {
            .success-details {
              grid-template-columns:
                1fr;
            }

            .success-actions
              :global(a) {
              width: 100%;
              text-align: center;
            }
          }
        `}</style>
      </>
    );
  }

  // ========================================================
  // CHECKOUT PAGE
  // ========================================================

  return (
    <>
      <Header />

      <main className="section-shell page-space checkout-page">
        <section className="checkout-heading">
          <div className="eyebrow">
            {t('SECURE CHECKOUT', 'নিরাপদ চেকআউট')}
          </div>

          <h1>
            {t('Almost yours.', 'অর্ডারটি প্রায় সম্পন্ন।')}
          </h1>

          <p>
            {t(
              "Enter your delivery information, choose where you want to send your advance payment, and submit your payment reference.",
              "আপনার ডেলিভারি তথ্য দিন, অগ্রিম পেমেন্টের মাধ্যম নির্বাচন করুন এবং পেমেন্ট রেফারেন্স জমা দিন।"
            )}
          </p>
        </section>

        {errorMessage && (
          <div className="checkout-error">
            <strong>
              {t("Couldn't continue", "এগিয়ে যাওয়া যাচ্ছে না")}
            </strong>

            <span>
              {localizeCheckoutMessage(
                errorMessage,
                lang
              )}
            </span>
          </div>
        )}

        {loading ? (
          <div className="checkout-loading">
            {t('Loading your cart...', 'আপনার কার্ট লোড হচ্ছে...')}
          </div>
        ) : lines.length === 0 ? (
          <div className="empty-checkout">
            <div>🛒</div>

            <h2>
            {t('Your cart is empty', 'আপনার কার্ট খালি')}
          </h2>

            <p>
              {t(
                "Add something you love before checking out.",
                "চেকআউটের আগে আপনার পছন্দের একটি পণ্য যোগ করুন।"
              )}
            </p>

            <a
              href="/shop"
              className="primary-button"
            >
            {t('Browse Books', 'বই দেখুন')}
          </a>
          </div>
        ) : (
          <div className="checkout-layout">
            <form
              className="checkout-main"
              onSubmit={
                handleSubmit
              }
            >
              <section className="checkout-panel">
                <div className="panel-title">
                  <span>01</span>

                  <div>
                    <h2>
            {t('Delivery', 'ডেলিভারি')}
          </h2>

                    <p>
            {t('Where should we send your order?', 'আপনার অর্ডার কোথায় পাঠাব?')}
          </p>
                  </div>
                </div>

                <div className="form-grid">
                  <label>
            {t('Full name', 'পূর্ণ নাম')}
          <input
                      required
                      value={
                        customerName
                      }
                      onChange={(e) =>
                        setCustomerName(
                          e.target
                            .value
                        )
                      }
                      placeholder={t("Your full name", "আপনার পূর্ণ নাম")}
                      disabled={
                        submitting
                      }
                    />
                  </label>

                  <label>
            {t('Phone', 'ফোন')}
          <input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) =>
                        setPhone(
                          e.target
                            .value
                        )
                      }
                      placeholder="01XXXXXXXXX"
                      disabled={
                        submitting
                      }
                    />
                  </label>
                </div>

                <label>
            {t('Full address', 'পূর্ণ ঠিকানা')}
          <textarea
                    required
                    value={address}
                    onChange={(e) =>
                      setAddress(
                        e.target.value
                      )
                    }
                    placeholder={t("House, road, area, district", "বাড়ি, রাস্তা, এলাকা, জেলা")}
                    disabled={
                      submitting
                    }
                  />
                </label>

                <label>
            {t('Delivery area', 'ডেলিভারি এলাকা')}
          <select
                    value={zone}
                    onChange={(e) =>
                      setZone(
                        e.target
                          .value as
                          | "dhaka"
                          | "outsideDhaka"
                      )
                    }
                    disabled={
                      submitting
                    }
                  >
                    <option value="dhaka">
                      {t("Dhaka", "ঢাকা")} — ৳
                      {
                        siteConfig
                          .delivery
                          .dhaka
                      }
                    </option>

                    <option value="outsideDhaka">
                      {t("Outside Dhaka", "ঢাকার বাইরে")} — ৳
                      {
                        siteConfig
                          .delivery
                          .outsideDhaka
                      }
                    </option>
                  </select>
                </label>
              </section>

              <section className="checkout-panel payment-panel">
                <div className="panel-title">
                  <span>02</span>

                  <div>
                    <h2>
            {t('Send advance', 'অগ্রিম পেমেন্ট পাঠান')}
          </h2>

                    <p>
            {t('Choose your preferred payment destination.', 'আপনার পছন্দের পেমেন্ট মাধ্যম নির্বাচন করুন।')}
          </p>
                  </div>
                </div>

                {paymentSettingsLoading ? (
                  <div className="payment-loading">
            {t('Loading payment options...', 'পেমেন্ট অপশন লোড হচ্ছে...')}
          </div>
                ) : !paymentSettings ? (
                  <div className="payment-unavailable">
            {t('Payment methods are temporarily unavailable.', 'পেমেন্ট মাধ্যমগুলো সাময়িকভাবে পাওয়া যাচ্ছে না।')}
          </div>
                ) : (
                  <>
                    <div className="payment-method-grid">
                      {paymentSettings.bkash_enabled && (
                        <button
                          type="button"
                          className={`payment-method-card ${
                            paymentMethod ===
                            "bKash"
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            setPaymentMethod(
                              "bKash"
                            )
                          }
                          disabled={
                            submitting
                          }
                        >
                          <span className="payment-logo bkash">
                            b
                          </span>

                          <span>
                            <strong>
                              bKash
                            </strong>
                            <small>
            {t('Send Money', 'টাকা পাঠান')}
          </small>
                          </span>

                          <i>
                            {paymentMethod ===
                            "bKash"
                              ? "✓"
                              : ""}
                          </i>
                        </button>
                      )}

                      {paymentSettings.bank_enabled && (
                        <button
                          type="button"
                          className={`payment-method-card ${
                            paymentMethod ===
                            "Bank"
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            setPaymentMethod(
                              "Bank"
                            )
                          }
                          disabled={
                            submitting
                          }
                        >
                          <span className="payment-logo bank">
                            B
                          </span>

                          <span>
                            <strong>
                              Bank
                            </strong>

                            <small>
            {t('Transfer', 'ট্রান্সফার')}
          </small>
                          </span>

                          <i>
                            {paymentMethod ===
                            "Bank"
                              ? "✓"
                              : ""}
                          </i>
                        </button>
                      )}

                      {paymentSettings.nagad_enabled && (
                        <button
                          type="button"
                          className={`payment-method-card ${
                            paymentMethod ===
                            "Nagad"
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            setPaymentMethod(
                              "Nagad"
                            )
                          }
                          disabled={
                            submitting
                          }
                        >
                          <span className="payment-logo nagad">
                            N
                          </span>

                          <span>
                            <strong>
                              Nagad
                            </strong>

                            <small>
            {t('Send Money', 'টাকা পাঠান')}
          </small>
                          </span>

                          <i>
                            {paymentMethod ===
                            "Nagad"
                              ? "✓"
                              : ""}
                          </i>
                        </button>
                      )}
                    </div>

                    {paymentMethod ===
                      "bKash" && (
                      <div className="destination-card">
                        <div className="destination-top">
                          <div>
                            <span>
            {t('SEND MONEY TO', 'টাকা পাঠান')}
          </span>

                            <h3>
                              {
                                paymentSettings.bkash_number
                              }
                            </h3>

                            <p>
                              bKash{" "}
                              {
                                paymentSettings.bkash_account_type
                              }{" "}
                              {t("Account", "অ্যাকাউন্ট")}
                            </p>
                          </div>

                          <button
                            type="button"
                            className="copy-button"
                            onClick={() =>
                              copyText(
                                paymentSettings.bkash_number
                              )
                            }
                          >
                            {copiedValue ===
                            paymentSettings.bkash_number
                              ? t("Copied ✓", "কপি হয়েছে ✓")
                              : t("Copy Number", "নম্বর কপি করুন")}
                          </button>
                        </div>

                        <div className="payment-instruction">
                          <strong>
            {t('How to pay', 'কীভাবে পেমেন্ট করবেন')}
          </strong>

                          <p>
                            {t(
                              "Open bKash → Send Money → enter the number above → send at least ৳60 or any amount up to your full order total.",
                              "bKash খুলুন → Send Money নির্বাচন করুন → উপরের নম্বরটি দিন → অন্তত ৳60 অথবা অর্ডারের সম্পূর্ণ মোট পর্যন্ত যেকোনো পরিমাণ পাঠান।"
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {paymentMethod ===
                      "Bank" && (
                      <div className="destination-card bank-details">
                        <div className="bank-title">
                          <span>
            {t('BANK TRANSFER', 'ব্যাংক ট্রান্সফার')}
          </span>

                          <h3>
                            {
                              paymentSettings.bank_name
                            }
                          </h3>
                        </div>

                        <div className="bank-detail-grid">
                          <div>
                            <span>
            {t('Account Name', 'অ্যাকাউন্টের নাম')}
          </span>

                            <strong>
                              {
                                paymentSettings.bank_account_name
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
            {t('Account Number', 'অ্যাকাউন্ট নম্বর')}
          </span>

                            <strong>
                              {
                                paymentSettings.bank_account_number
                              }
                            </strong>

                            <button
                              type="button"
                              onClick={() =>
                                copyText(
                                  paymentSettings.bank_account_number
                                )
                              }
                            >
                              {copiedValue ===
                              paymentSettings.bank_account_number
                                ? t("Copied ✓", "কপি হয়েছে ✓")
                                : t("Copy", "কপি")}
                            </button>
                          </div>

                          <div>
                            <span>
            {t('Branch', 'শাখা')}
          </span>

                            <strong>
                              {
                                paymentSettings.bank_branch
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
            {t('Routing Number', 'রাউটিং নম্বর')}
          </span>

                            <strong>
                              {
                                paymentSettings.bank_routing_number
                              }
                            </strong>

                            <button
                              type="button"
                              onClick={() =>
                                copyText(
                                  paymentSettings.bank_routing_number
                                )
                              }
                            >
                              {copiedValue ===
                              paymentSettings.bank_routing_number
                                ? t("Copied ✓", "কপি হয়েছে ✓")
                                : t("Copy", "কপি")}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod ===
                      "Nagad" && (
                      <div className="destination-card">
                        <div className="destination-top">
                          <div>
                            <span>
            {t('SEND MONEY TO', 'টাকা পাঠান')}
          </span>

                            <h3>
                              {
                                paymentSettings.nagad_number
                              }
                            </h3>

                            <p>
                              Nagad{" "}
                              {
                                paymentSettings.nagad_account_type
                              }{" "}
                              {t("Account", "অ্যাকাউন্ট")}
                            </p>
                          </div>

                          <button
                            type="button"
                            className="copy-button"
                            onClick={() =>
                              copyText(
                                paymentSettings.nagad_number
                              )
                            }
                          >
                            {copiedValue ===
                            paymentSettings.nagad_number
                              ? t("Copied ✓", "কপি হয়েছে ✓")
                              : t("Copy Number", "নম্বর কপি করুন")}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>

              <section className="checkout-panel">
                <div className="panel-title">
                  <span>03</span>

                  <div>
                    <h2>
            {t('Payment proof', 'পেমেন্ট প্রুফ')}
          </h2>

                    <p>
            {t('Tell us what you sent so the team can verify it.', 'আপনি কী পাঠিয়েছেন তা জানান, যাতে আমাদের টিম যাচাই করতে পারে।')}
          </p>
                  </div>
                </div>

                <div className="form-grid">
                  <label>
                    {paymentMethod ===
                    "Bank"
                      ? "Transaction / Reference Number"
                      : "Transaction ID"}

                    <input
                      required
                      value={
                        transactionId
                      }
                      onChange={(e) =>
                        setTransactionId(
                          e.target
                            .value
                        )
                      }
                      placeholder={
                        paymentMethod ===
                        "Bank"
                          ? t("Enter bank reference", "ব্যাংক রেফারেন্স লিখুন")
                          : t("Enter transaction ID", "Transaction ID লিখুন")
                      }
                      disabled={
                        submitting
                      }
                    />
                  </label>

                  <label>
            {t('Amount Claimed Sent', 'পাঠানো দাবি করা পরিমাণ')}
          <input
                      required
                      type="number"
                      min={
                        total >= 60
                          ? 60
                          : total
                      }
                      max={total}
                      step="1"
                      value={
                        claimedAmount
                      }
                      onChange={(e) =>
                        setClaimedAmount(
                          e.target
                            .value
                        )
                      }
                      placeholder={t("Minimum ৳60", "সর্বনিম্ন ৳60")}
                      disabled={
                        submitting
                      }
                    />
                  </label>
                </div>

                <div className="amount-summary">
                  <div>
                    <span>
            {t('Order Total', 'অর্ডারের মোট')}
          </span>

                    <strong>
                      ৳{total}
                    </strong>
                  </div>

                  <div>
                    <span>
            {t('Claimed Sent', 'পাঠানো দাবি')}
          </span>

                    <strong>
                      ৳
                      {
                        numericClaimedAmount
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
            {t('Due on Delivery', 'ডেলিভারির সময় বাকি')}
          </span>

                    <strong>
                      ৳
                      {dueAmount}
                    </strong>
                  </div>
                </div>

                <div className="progress-track">
                  <span
                    style={{
                      width: `${paymentPercentage}%`,
                    }}
                  />
                </div>

                <div className="advance-note">
                  {t(
                    "Minimum advance is ৳60. You may also send the full order amount. All submitted payments remain pending until manual verification.",
                    "সর্বনিম্ন অগ্রিম ৳60। চাইলে অর্ডারের সম্পূর্ণ টাকাও পাঠাতে পারেন। জমা দেওয়া সব পেমেন্ট ম্যানুয়াল যাচাই না হওয়া পর্যন্ত অপেক্ষমাণ থাকবে।"
                  )}
                </div>

                <label className="proof-upload">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) =>
                      handleProofChange(
                        e.target
                          .files?.[0] ??
                          null
                      )
                    }
                    disabled={
                      submitting
                    }
                  />

                  {paymentProofPreview ? (
                    <div className="proof-preview">
                      <img
                        src={
                          paymentProofPreview
                        }
                        alt={t("Payment screenshot preview", "পেমেন্ট স্ক্রিনশট প্রিভিউ")}
                      />

                      <div>
                        <strong>
            {t('Screenshot selected', 'স্ক্রিনশট নির্বাচন করা হয়েছে')}
          </strong>

                        <span>
                          {
                            paymentProof?.name
                          }
                        </span>

                        <small>
            {t('Click here to replace it', 'পরিবর্তন করতে এখানে ক্লিক করুন')}
          </small>
                      </div>
                    </div>
                  ) : (
                    <div className="proof-placeholder">
                      <span className="upload-icon">
                        ↑
                      </span>

                      <div>
                        <strong>
            {t('Add payment screenshot', 'পেমেন্ট স্ক্রিনশট যোগ করুন')}
          </strong>

                        <span>
            {t('Optional but recommended', 'ঐচ্ছিক, তবে দেওয়া ভালো')}
          </span>

                        <small>
            {t('JPG, PNG or WEBP · Max 5 MB', 'JPG, PNG বা WEBP · সর্বোচ্চ 5 MB')}
          </small>
                      </div>
                    </div>
                  )}
                </label>


                <section
                  className={`coupon-box checkout-coupon-before-submit ${
                    appliedCoupon
                      ? "applied"
                      : couponError
                      ? "error"
                      : ""
                  }`}
                >
                  <div className="coupon-box-glow" />

                  <div className="coupon-box-heading">
                    <div className="coupon-icon">
                      %
                    </div>

                    <div>
                      <strong>
            {t('Have a coupon?', 'কুপন আছে?')}
          </strong>

                      <span>
            {t('Add your code and unlock your offer.', 'কুপন কোড দিয়ে আপনার অফারটি নিন।')}
          </span>
                    </div>
                  </div>

                  {!appliedCoupon ? (
                    <>
                      <div className="coupon-input-row">
                        <input
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(
                              e.target.value
                                .toUpperCase()
                            );

                            if (couponError) {
                              setCouponError("");
                            }

                            if (couponSuccess) {
                              setCouponSuccess("");
                            }
                          }}
                          onKeyDown={(e) => {
                            if (
                              e.key ===
                              "Enter"
                            ) {
                              e.preventDefault();

                              if (
                                !couponLoading
                              ) {
                                applyCoupon();
                              }
                            }
                          }}
                          placeholder={t("Enter coupon code", "কুপন কোড লিখুন")}
                          maxLength={50}
                          autoComplete="off"
                          disabled={
                            couponLoading ||
                            submitting
                          }
                        />

                        <button
                          type="button"
                          className="coupon-apply-button"
                          onClick={
                            applyCoupon
                          }
                          disabled={
                            couponLoading ||
                            submitting ||
                            !couponCode.trim()
                          }
                        >
                          {couponLoading ? (
                            <>
                              <span className="coupon-spinner" />
            {t('Checking', 'যাচাই হচ্ছে')}
          </>
                          ) : (
                            t("Apply", "প্রয়োগ করুন")
                          )}
                        </button>
                      </div>

                      {couponError && (
                        <div className="coupon-feedback error">
                          <span>!</span>

                          <p>
                            {localizeCheckoutMessage(couponError, lang)}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="coupon-applied-card">
                      <div className="coupon-success-mark">
                        ✓
                      </div>

                      <div className="coupon-applied-copy">
                        <span>
            {t('COUPON APPLIED', 'কুপন প্রয়োগ হয়েছে')}
          </span>

                        <strong>
                          {appliedCoupon.code}
                        </strong>

                        <p>
                          {t("You saved", "আপনি সাশ্রয় করেছেন")}
                          {" "}
                          <b>
                            ৳{discountAmount}
                          </b>
                          {appliedCoupon.discountType ===
                          "percentage"
                            ? t(
                                ` · ${appliedCoupon.discountValue}% off`,
                                ` · ${appliedCoupon.discountValue}% ছাড়`
                              )
                            : ""}

                          {appliedCoupon.scopeName &&
                          appliedCoupon.scopeName !==
                            "All Products"
                            ? ` · ${appliedCoupon.scopeName}`
                            : ""}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="coupon-remove-button"
                        onClick={
                          removeCoupon
                        }
                        disabled={
                          submitting
                        }
                      >
            {t('Remove', 'মুছুন')}
          </button>

                      <span className="coupon-spark spark-one" />
                      <span className="coupon-spark spark-two" />
                      <span className="coupon-spark spark-three" />
                    </div>
                  )}
                </section>

                <button
                  className="primary-button wide checkout-submit"
                  type="submit"
                  disabled={
                    submitting ||
                    loading ||
                    paymentSettingsLoading ||
                    !paymentSettings ||
                    lines.length ===
                      0
                  }
                >
                  {submitting
                    ? t("Securing Your Order...", "আপনার অর্ডার নিশ্চিত করা হচ্ছে...")
                    : t(`Place Order · ৳${total}`, `অর্ডার করুন · ৳${total}`)}
                </button>
              </section>
            </form>

            <aside className="checkout-summary">
              <div className="summary-sticky">
                <div className="summary-heading">
                  <span>
            {t('YOUR ORDER', 'আপনার অর্ডার')}
          </span>

                  <strong>
                    {lines.reduce(
                      (
                        totalQty,
                        line
                      ) =>
                        totalQty +
                        line.qty,
                      0
                    )}{" "}
                    {lang === "bn"
                      ? "টি পণ্য"
                      : `item${
                          lines.reduce(
                            (
                              totalQty,
                              line
                            ) =>
                              totalQty +
                              line.qty,
                            0
                          ) === 1
                            ? ""
                            : "s"
                        }`}
                  </strong>
                </div>

                <div className="summary-products">
                  {lines.map(
                    (line) => (
                      <div
                        key={
                          line.key
                        }
                        className="summary-product"
                      >
                        <div>
                          <strong>
                            {
                              line
                                .product
                                .name
                            }
                          </strong>

                          <span>
                            {t("Qty", "পরিমাণ")} {" "}
                            {
                              line.qty
                            }

                            {(line.size ||
                              line.color) &&
                              ` · ${[
                                line.size
                                  ? `Size ${line.size}`
                                  : null,

                                line.color
                                  ? line.color
                                  : null,
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  " · "
                                )}`}
                          </span>
                        </div>

                        <strong>
                          ৳
                          {line.sellingPrice *
                            line.qty}
                        </strong>
                      </div>
                    )
                  )}
                </div>

                <div className="summary-price-list">
                  <div>
                    <span>
            {t('Subtotal', 'পণ্যের মোট')}
          </span>

                    <strong>
                      ৳{subtotal}
                    </strong>
                  </div>

                  {discountAmount > 0 && (
                    <div className="summary-discount-row">
                      <span>
                        Coupon
                        {appliedCoupon?.code
                          ? ` · ${appliedCoupon.code}`
                          : ""}
                      </span>

                      <strong>
                        -৳{discountAmount}
                      </strong>
                    </div>
                  )}

                  <div>
                    <span>
            {t('Delivery', 'ডেলিভারি')}
          </span>

                    <strong>
                      ৳{shipping}
                    </strong>
                  </div>

                  <div className="summary-total">
                    <span>
            {t('Total', 'সর্বমোট')}
          </span>

                    <strong>
                      ৳{total}
                    </strong>
                  </div>
                </div>

                <div className="summary-security">
                  <span>◈</span>

                  <p>
                    {t(
                      "Payment information is manually verified before order confirmation.",
                      "অর্ডার নিশ্চিত করার আগে পেমেন্ট তথ্য ম্যানুয়ালি যাচাই করা হয়।"
                    )}
                  </p>
                </div>

                <div className="courier-note">
                  {t("Delivery via", "ডেলিভারি মাধ্যম")} {" "}
                  <strong>
                    {
                      siteConfig
                        .delivery
                        .courier
                    }
                  </strong>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />

      <style jsx>{`
        .checkout-page {
          padding-bottom: 90px;
        }

        .checkout-heading {
          max-width: 720px;
          padding: 24px 0 38px;
          animation:
            checkoutEnter
            0.55s ease both;
        }

        .checkout-heading h1 {
          margin: 7px 0 12px;
          color: #19203f;
          font-size:
            clamp(
              3rem,
              7vw,
              5.5rem
            );
          line-height: 0.9;
          letter-spacing:
            -0.07em;
        }

        .checkout-heading p {
          max-width: 630px;
          margin: 0;
          color: #747b8e;
          line-height: 1.75;
        }

        .checkout-error {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 22px;
          padding: 16px 18px;
          border: 1px solid
            #f1cccc;
          border-radius: 16px;
          background: #fff6f6;
          color: #a13d3d;
        }

        .checkout-error span {
          font-size: 0.83rem;
        }

        .checkout-layout {
          display: grid;
          grid-template-columns:
            minmax(0, 1.7fr)
            minmax(
              290px,
              0.75fr
            );
          align-items: start;
          gap: 26px;
        }

        .checkout-main {
          display: grid;
          gap: 18px;
        }

        .checkout-panel {
          padding: 27px;
          border: 1px solid
            #e5e7ed;
          border-radius: 26px;
          background: white;
          box-shadow:
            0 14px 40px
            rgba(
              31,
              41,
              77,
              0.035
            );
          animation:
            panelEnter
            0.55s ease both;
        }

        .checkout-panel:nth-child(
            2
          ) {
          animation-delay:
            70ms;
        }

        .checkout-panel:nth-child(
            3
          ) {
          animation-delay:
            140ms;
        }

        .panel-title {
          display: flex;
          align-items:
            flex-start;
          gap: 13px;
          margin-bottom: 24px;
        }

        .panel-title
          > span {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          flex: 0 0 auto;
          border-radius: 13px;
          background: #202a4e;
          color: white;
          font-size: 0.72rem;
          font-weight: 850;
        }

        .panel-title h2 {
          margin: 0;
          color: #222944;
          font-size: 1.2rem;
        }

        .panel-title p {
          margin: 3px 0 0;
          color: #9297a5;
          font-size: 0.78rem;
        }

        .checkout-panel
          label {
          display: grid;
          gap: 8px;
          margin-bottom: 16px;
          color: #4f566d;
          font-size: 0.8rem;
          font-weight: 720;
        }

        .form-grid {
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );
          gap: 14px;
        }

        .checkout-panel
          :global(input),
        .checkout-panel
          :global(textarea),
        .checkout-panel
          :global(select) {
          width: 100%;
          box-sizing: border-box;
          padding: 13px 14px;
          border: 1px solid
            #dde0e7;
          border-radius: 13px;
          outline: none;
          background: #fbfcfd;
          color: #242b44;
          transition:
            border-color
              0.18s ease,
            box-shadow
              0.18s ease,
            background 0.18s
              ease;
        }

        .checkout-panel
          :global(input:focus),
        .checkout-panel
          :global(textarea:focus),
        .checkout-panel
          :global(select:focus) {
          border-color:
            #7783ab;
          background: white;
          box-shadow:
            0 0 0 4px
            rgba(
              82,
              97,
              153,
              0.08
            );
        }

        .checkout-panel
          :global(textarea) {
          min-height: 105px;
          resize: vertical;
        }

        .payment-method-grid {
          display: grid;
          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );
          gap: 10px;
          margin-bottom: 16px;
        }

        .payment-method-card {
          display: grid;
          grid-template-columns:
            auto 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 13px;
          border: 1px solid
            #e1e4eb;
          border-radius: 16px;
          background: white;
          text-align: left;
          cursor: pointer;
          transition:
            transform 0.18s
              ease,
            border-color
              0.18s ease,
            box-shadow 0.18s
              ease;
        }

        .payment-method-card:hover {
          transform:
            translateY(-2px);
        }

        .payment-method-card.active {
          border-color:
            #4e5f91;
          box-shadow:
            0 0 0 3px
              rgba(
                60,
                77,
                131,
                0.07
              ),
            0 10px 24px
              rgba(
                31,
                41,
                77,
                0.07
              );
        }

        .payment-logo {
          display: grid;
          place-items: center;
          width: 39px;
          height: 39px;
          border-radius: 12px;
          color: white;
          font-size: 1.05rem;
          font-weight: 900;
        }

        .payment-logo.bkash {
          background: #d51f63;
        }

        .payment-logo.bank {
          background: #26365e;
        }

        .payment-logo.nagad {
          background: #e16a25;
        }

        .payment-method-card
          strong,
        .payment-method-card
          small {
          display: block;
        }

        .payment-method-card
          strong {
          color: #353c56;
        }

        .payment-method-card
          small {
          margin-top: 2px;
          color: #989dac;
        }

        .payment-method-card
          i {
          color: #415383;
          font-style: normal;
          font-weight: 900;
        }

        .destination-card {
          position: relative;
          overflow: hidden;
          padding: 22px;
          border-radius: 20px;
          background:
            linear-gradient(
              135deg,
              #20294b,
              #303d6e
            );
          color: white;
          animation:
            destinationIn
            0.32s ease both;
        }

        .destination-card::after {
          content: "";
          position: absolute;
          width: 170px;
          height: 170px;
          right: -55px;
          top: -80px;
          border-radius: 50%;
          background:
            rgba(
              255,
              255,
              255,
              0.06
            );
        }

        .destination-top {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content:
            space-between;
          align-items: center;
          gap: 20px;
        }

        .destination-top
          span,
        .bank-title span {
          font-size: 0.64rem;
          font-weight: 800;
          letter-spacing:
            0.11em;
          opacity: 0.7;
        }

        .destination-top h3,
        .bank-title h3 {
          margin: 6px 0 3px;
          font-size: 1.6rem;
        }

        .destination-top p {
          margin: 0;
          font-size: 0.75rem;
          opacity: 0.76;
        }

        .copy-button {
          position: relative;
          z-index: 2;
          padding: 10px 13px;
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.2
            );
          border-radius: 11px;
          background:
            rgba(
              255,
              255,
              255,
              0.08
            );
          color: white;
          font-weight: 750;
          cursor: pointer;
        }

        .payment-instruction {
          position: relative;
          z-index: 1;
          margin-top: 18px;
          padding-top: 15px;
          border-top: 1px solid
            rgba(
              255,
              255,
              255,
              0.12
            );
        }

        .payment-instruction
          p {
          margin: 5px 0 0;
          line-height: 1.65;
          font-size: 0.75rem;
          opacity: 0.77;
        }

        .bank-detail-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );
          gap: 11px;
          margin-top: 17px;
        }

        .bank-detail-grid
          div {
          padding: 12px;
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.12
            );
          border-radius: 13px;
          background:
            rgba(
              255,
              255,
              255,
              0.055
            );
        }

        .bank-detail-grid
          span,
        .bank-detail-grid
          strong {
          display: block;
        }

        .bank-detail-grid
          span {
          margin-bottom: 5px;
          font-size: 0.64rem;
          opacity: 0.62;
        }

        .bank-detail-grid
          strong {
          font-size: 0.84rem;
          overflow-wrap:
            anywhere;
        }

        .bank-detail-grid
          button {
          margin-top: 7px;
          padding: 0;
          border: none;
          background: none;
          color: white;
          font-size: 0.68rem;
          text-decoration:
            underline;
          cursor: pointer;
          opacity: 0.8;
        }

        .amount-summary {
          display: grid;
          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );
          gap: 9px;
          margin: 5px 0 13px;
        }

        .amount-summary div {
          padding: 13px;
          border-radius: 14px;
          background: #f6f7fa;
        }

        .amount-summary span,
        .amount-summary
          strong {
          display: block;
        }

        .amount-summary span {
          margin-bottom: 4px;
          color: #9196a4;
          font-size: 0.62rem;
        }

        .amount-summary strong {
          color: #353c56;
          font-size: 0.9rem;
        }

        .progress-track {
          width: 100%;
          height: 7px;
          overflow: hidden;
          margin-bottom: 13px;
          border-radius: 999px;
          background: #eaecf1;
        }

        .progress-track
          span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background:
            linear-gradient(
              90deg,
              #344475,
              #697bb7
            );
          transition:
            width 0.3s ease;
        }

        .advance-note {
          margin-bottom: 17px;
          padding: 12px 14px;
          border-radius: 13px;
          background: #f7f8fc;
          color: #747b8e;
          line-height: 1.65;
          font-size: 0.75rem;
        }

        .proof-upload {
          display: block !important;
          margin: 0 0 20px !important;
          cursor: pointer;
        }

        .proof-upload
          :global(input) {
          display: none;
        }

        .proof-placeholder,
        .proof-preview {
          display: flex;
          align-items: center;
          gap: 15px;
          min-height: 105px;
          padding: 16px;
          border: 1px dashed
            #cfd3df;
          border-radius: 17px;
          background: #fafbfc;
          transition:
            border-color
              0.18s ease,
            background 0.18s
              ease;
        }

        .proof-placeholder:hover {
          border-color:
            #7f8aaa;
          background: #f7f8fb;
        }

        .upload-icon {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          flex: 0 0 auto;
          border-radius: 15px;
          background: #222e53;
          color: white;
          font-size: 1.3rem;
        }

        .proof-placeholder
          strong,
        .proof-placeholder
          span,
        .proof-placeholder
          small,
        .proof-preview
          strong,
        .proof-preview
          span,
        .proof-preview
          small {
          display: block;
        }

        .proof-placeholder
          strong,
        .proof-preview
          strong {
          color: #3b425b;
        }

        .proof-placeholder
          div
          > span,
        .proof-preview
          div
          > span {
          margin-top: 3px;
          color: #858b9b;
          font-size: 0.76rem;
        }

        .proof-placeholder
          small,
        .proof-preview
          small {
          margin-top: 4px;
          color: #a3a7b4;
          font-size: 0.65rem;
        }

        .proof-preview img {
          width: 74px;
          height: 74px;
          flex: 0 0 auto;
          object-fit: cover;
          border-radius: 13px;
        }

        .checkout-submit {
          position: relative;
          overflow: hidden;
          min-height: 52px;
          transition:
            transform 0.18s
              ease,
            box-shadow 0.18s
              ease,
            opacity 0.18s
              ease;
        }

        .checkout-submit::after {
          content: "";
          position: absolute;
          top: -140%;
          left: -35%;
          width: 30%;
          height: 380%;
          transform:
            rotate(22deg);
          background:
            rgba(
              255,
              255,
              255,
              0.17
            );
          transition:
            left 0.55s ease;
          pointer-events: none;
        }

        .checkout-submit:hover:not(:disabled) {
          transform:
            translateY(-2px);
          box-shadow:
            0 14px 30px
            rgba(
              32,
              45,
              82,
              0.18
            );
        }

        .checkout-submit:hover:not(:disabled)::after {
          left: 120%;
        }

        .checkout-submit:active:not(:disabled) {
          transform:
            translateY(0)
            scale(0.99);
        }

        .checkout-summary {
          min-width: 0;
        }

        .summary-sticky {
          position: sticky;
          top: 100px;
          overflow: hidden;
          border: 1px solid
            #e3e6ec;
          border-radius: 25px;
          background: #fff;
          box-shadow:
            0 18px 45px
            rgba(
              31,
              41,
              77,
              0.055
            );
          animation:
            panelEnter
            0.55s ease
            120ms both;
        }

        .summary-heading {
          display: flex;
          justify-content:
            space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid
            #edf0f4;
        }

        .summary-heading span {
          color: #959aa8;
          font-size: 0.65rem;
          font-weight: 850;
          letter-spacing:
            0.1em;
        }

        .summary-heading strong {
          color: #555d73;
          font-size: 0.75rem;
        }

        .summary-products {
          padding: 18px 20px;
        }

        .summary-product {
          display: grid;
          grid-template-columns:
            1fr auto;
          gap: 10px;
          padding: 11px 0;
          border-bottom: 1px solid
            #f0f1f4;
        }

        .summary-product:last-child {
          border-bottom: none;
        }

        .summary-product
          strong {
          color: #3e455d;
          font-size: 0.79rem;
        }

        .summary-product
          div
          > span {
          display: block;
          margin-top: 3px;
          color: #9a9eab;
          font-size: 0.67rem;
        }

        .coupon-box {
          position: relative;
          overflow: hidden;
          margin: 0 20px 18px;
          padding: 17px;
          border: 1px solid
            #e3e6ee;
          border-radius: 19px;
          background:
            linear-gradient(
              145deg,
              #fbfcff,
              #f7f8fc
            );
          transition:
            border-color
              0.24s ease,
            box-shadow
              0.24s ease,
            transform
              0.24s ease,
            background
              0.24s ease;
        }


        .checkout-coupon-before-submit {
          margin: 18px 0;
        }
        .coupon-box:hover {
          transform:
            translateY(-1px);
          border-color:
            #cfd5e5;
          box-shadow:
            0 12px 28px
            rgba(
              39,
              52,
              92,
              0.06
            );
        }

        .coupon-box.applied {
          border-color:
            #cfe6d5;
          background:
            linear-gradient(
              145deg,
              #f7fcf8,
              #ffffff
            );
          box-shadow:
            0 14px 32px
            rgba(
              56,
              125,
              79,
              0.08
            );
        }

        .coupon-box.error {
          border-color:
            #edcccc;
          background:
            linear-gradient(
              145deg,
              #fffafa,
              #fffefe
            );
          animation:
            couponShake
            0.38s ease both;
        }

        .coupon-box-glow {
          position: absolute;
          top: -90px;
          right: -80px;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background:
            radial-gradient(
              circle,
              rgba(
                76,
                96,
                162,
                0.11
              ),
              transparent 70%
            );
          pointer-events: none;
        }

        .coupon-box.applied
          .coupon-box-glow {
          background:
            radial-gradient(
              circle,
              rgba(
                64,
                143,
                89,
                0.14
              ),
              transparent 70%
            );
          animation:
            couponGlow
            2.2s ease-in-out
            infinite;
        }

        .coupon-box-heading {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 14px;
        }

        .coupon-icon {
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          flex: 0 0 auto;
          border-radius: 13px;
          background:
            linear-gradient(
              145deg,
              #26355f,
              #42548a
            );
          color: white;
          font-size: 1rem;
          font-weight: 900;
          box-shadow:
            0 9px 20px
            rgba(
              38,
              53,
              95,
              0.18
            );
        }

        .coupon-box-heading
          strong,
        .coupon-box-heading
          span {
          display: block;
        }

        .coupon-box-heading
          strong {
          color: #303850;
          font-size: 0.84rem;
        }

        .coupon-box-heading
          span {
          margin-top: 2px;
          color: #9298a8;
          font-size: 0.67rem;
          line-height: 1.45;
        }

        .coupon-input-row {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            auto;
          gap: 8px;
        }

        .coupon-input-row
          :global(input) {
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
          padding: 12px 13px;
          border: 1px solid
            #dce1eb;
          border-radius: 12px;
          outline: none;
          background: white;
          color: #27304b;
          font-weight: 760;
          letter-spacing:
            0.04em;
          text-transform:
            uppercase;
          transition:
            border-color
              0.18s ease,
            box-shadow
              0.18s ease;
        }

        .coupon-input-row
          :global(input:focus) {
          border-color:
            #7583ae;
          box-shadow:
            0 0 0 4px
            rgba(
              84,
              100,
              155,
              0.08
            );
        }

        .coupon-apply-button {
          position: relative;
          overflow: hidden;
          min-width: 92px;
          padding: 0 15px;
          border: none;
          border-radius: 12px;
          background:
            linear-gradient(
              135deg,
              #202d54,
              #394b7d
            );
          color: white;
          font-size: 0.72rem;
          font-weight: 820;
          cursor: pointer;
          box-shadow:
            0 9px 20px
            rgba(
              33,
              45,
              84,
              0.16
            );
          transition:
            transform
              0.18s ease,
            box-shadow
              0.18s ease,
            opacity
              0.18s ease;
        }

        .coupon-apply-button::after {
          content: "";
          position: absolute;
          top: -120%;
          left: -40%;
          width: 35%;
          height: 340%;
          transform:
            rotate(22deg);
          background:
            rgba(
              255,
              255,
              255,
              0.18
            );
          transition:
            left 0.45s ease;
        }

        .coupon-apply-button:hover:not(:disabled) {
          transform:
            translateY(-2px);
          box-shadow:
            0 13px 26px
            rgba(
              33,
              45,
              84,
              0.22
            );
        }

        .coupon-apply-button:hover:not(:disabled)::after {
          left: 120%;
        }

        .coupon-apply-button:active:not(:disabled) {
          transform:
            translateY(0)
            scale(0.98);
        }

        .coupon-apply-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          box-shadow: none;
        }

        .coupon-spinner {
          display: inline-block;
          width: 12px;
          height: 12px;
          margin-right: 6px;
          vertical-align: -2px;
          border: 2px solid
            rgba(
              255,
              255,
              255,
              0.32
            );
          border-top-color:
            white;
          border-radius: 50%;
          animation:
            couponSpin
            0.7s linear
            infinite;
        }

        .coupon-feedback {
          position: relative;
          z-index: 1;
          display: flex;
          align-items:
            flex-start;
          gap: 8px;
          margin-top: 10px;
          padding: 9px 10px;
          border-radius: 11px;
          animation:
            couponFeedbackIn
            0.26s ease both;
        }

        .coupon-feedback.error {
          background: #fff0f0;
          color: #a44848;
        }

        .coupon-feedback
          > span {
          display: grid;
          place-items: center;
          width: 18px;
          height: 18px;
          flex: 0 0 auto;
          border-radius: 50%;
          background: #b34b4b;
          color: white;
          font-size: 0.68rem;
          font-weight: 900;
        }

        .coupon-feedback p {
          margin: 0;
          line-height: 1.5;
          font-size: 0.68rem;
        }

        .coupon-applied-card {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns:
            auto 1fr auto;
          align-items: center;
          gap: 11px;
          min-height: 70px;
          padding: 12px;
          overflow: hidden;
          border: 1px solid
            #d7eadc;
          border-radius: 15px;
          background:
            linear-gradient(
              135deg,
              #eef9f1,
              #f8fcf9
            );
          animation:
            couponAppliedIn
            0.42s
            cubic-bezier(
              0.2,
              0.8,
              0.2,
              1
            ) both;
        }

        .coupon-success-mark {
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          border-radius: 13px;
          background:
            linear-gradient(
              145deg,
              #34764a,
              #4b9462
            );
          color: white;
          font-size: 1rem;
          font-weight: 900;
          box-shadow:
            0 9px 22px
            rgba(
              52,
              118,
              74,
              0.22
            );
          animation:
            couponCheckPop
            0.5s ease both;
        }

        .coupon-applied-copy
          span,
        .coupon-applied-copy
          strong {
          display: block;
        }

        .coupon-applied-copy
          span {
          margin-bottom: 2px;
          color: #6e9178;
          font-size: 0.56rem;
          font-weight: 900;
          letter-spacing:
            0.1em;
        }

        .coupon-applied-copy
          strong {
          color: #295c3b;
          font-size: 0.92rem;
          letter-spacing:
            0.04em;
        }

        .coupon-applied-copy p {
          margin: 3px 0 0;
          color: #6c7e72;
          font-size: 0.67rem;
        }

        .coupon-applied-copy b {
          color: #2f7549;
        }

        .coupon-remove-button {
          padding: 8px 9px;
          border: 1px solid
            #cfe2d4;
          border-radius: 10px;
          background:
            rgba(
              255,
              255,
              255,
              0.8
            );
          color: #497156;
          font-size: 0.63rem;
          font-weight: 800;
          cursor: pointer;
          transition:
            transform
              0.18s ease,
            background
              0.18s ease;
        }

        .coupon-remove-button:hover:not(:disabled) {
          transform:
            translateY(-1px);
          background: white;
        }

        .coupon-spark {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #63a777;
          opacity: 0;
          pointer-events: none;
          animation:
            couponSpark
            0.8s ease-out
            both;
        }

        .spark-one {
          top: 13px;
          right: 65px;
        }

        .spark-two {
          top: 34px;
          right: 44px;
          animation-delay:
            70ms;
        }

        .spark-three {
          bottom: 10px;
          right: 78px;
          animation-delay:
            120ms;
        }

        .summary-price-list {
          padding: 18px 20px;
          border-top: 1px solid
            #edf0f4;
          background: #fafbfc;
        }

        .summary-price-list
          div {
          display: flex;
          justify-content:
            space-between;
          gap: 15px;
          margin-bottom: 10px;
          color: #72798b;
          font-size: 0.78rem;
        }

        .summary-price-list
          div:last-child {
          margin-bottom: 0;
        }

        .summary-discount-row {
          margin: 7px -7px 10px !important;
          padding: 9px 7px;
          border-radius: 10px;
          background:
            linear-gradient(
              90deg,
              #eef9f1,
              rgba(
                238,
                249,
                241,
                0.35
              )
            );
          color: #3f7650 !important;
          animation:
            couponDiscountIn
            0.42s ease both;
        }

        .summary-discount-row
          strong {
          color: #2f7549;
          font-size: 0.88rem;
        }

        .summary-total {
          margin-top: 14px !important;
          padding-top: 14px;
          border-top: 1px solid
            #e3e5ea;
          color: #222a47 !important;
          font-size: 1rem !important;
        }

        .summary-security {
          display: flex;
          gap: 10px;
          padding: 16px 20px;
          border-top: 1px solid
            #edf0f4;
          color: #70788b;
        }

        .summary-security
          span {
          color: #40517f;
        }

        .summary-security p {
          margin: 0;
          line-height: 1.55;
          font-size: 0.7rem;
        }

        .courier-note {
          padding: 13px 20px;
          background: #222d50;
          color:
            rgba(
              255,
              255,
              255,
              0.75
            );
          font-size: 0.7rem;
        }

        .courier-note strong {
          color: white;
        }

        .empty-checkout,
        .checkout-loading {
          display: grid;
          place-items: center;
          min-height: 320px;
          padding: 40px;
          border: 1px dashed
            #dce0e7;
          border-radius: 26px;
          background: #fafbfc;
          text-align: center;
        }

        .empty-checkout div {
          font-size: 3rem;
        }

        .empty-checkout h2 {
          margin: 6px 0;
          color: #313950;
        }

        .empty-checkout p {
          color: #8c92a0;
        }

        @keyframes couponSpin {
          to {
            transform:
              rotate(360deg);
          }
        }

        @keyframes couponShake {
          0%,
          100% {
            transform:
              translateX(0);
          }

          25% {
            transform:
              translateX(-4px);
          }

          50% {
            transform:
              translateX(4px);
          }

          75% {
            transform:
              translateX(-2px);
          }
        }

        @keyframes couponGlow {
          50% {
            transform:
              scale(1.08);
            opacity: 0.75;
          }
        }

        @keyframes couponFeedbackIn {
          from {
            opacity: 0;
            transform:
              translateY(-4px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }
        }

        @keyframes couponAppliedIn {
          from {
            opacity: 0;
            transform:
              scale(0.97)
              translateY(7px);
          }

          to {
            opacity: 1;
            transform:
              scale(1)
              translateY(0);
          }
        }

        @keyframes couponCheckPop {
          0% {
            opacity: 0;
            transform:
              scale(0.55)
              rotate(-10deg);
          }

          70% {
            transform:
              scale(1.12)
              rotate(2deg);
          }

          100% {
            opacity: 1;
            transform:
              scale(1)
              rotate(0);
          }
        }

        @keyframes couponSpark {
          0% {
            opacity: 0;
            transform:
              scale(0.2)
              translateY(8px);
          }

          35% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform:
              scale(1.4)
              translateY(-16px);
          }
        }

        @keyframes couponDiscountIn {
          from {
            opacity: 0;
            transform:
              translateY(-5px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }
        }

        @keyframes checkoutEnter {
          from {
            opacity: 0;
            transform:
              translateY(15px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }
        }

        @keyframes panelEnter {
          from {
            opacity: 0;
            transform:
              translateY(12px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }
        }

        @keyframes destinationIn {
          from {
            opacity: 0;
            transform:
              scale(0.985)
              translateY(5px);
          }

          to {
            opacity: 1;
            transform:
              scale(1)
              translateY(0);
          }
        }

        @media (
          max-width: 980px
        ) {
          .checkout-layout {
            grid-template-columns:
              1fr;
          }

          .summary-sticky {
            position: static;
          }
        }

        @media (
          max-width: 650px
        ) {
          .checkout-heading {
            padding-bottom:
              28px;
          }

          .checkout-panel {
            padding: 20px;
            border-radius: 21px;
          }

          .form-grid,
          .amount-summary,
          .bank-detail-grid {
            grid-template-columns:
              1fr;
          }

          .payment-method-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .destination-top {
            align-items:
              flex-start;
            flex-direction:
              column;
          }

          .coupon-input-row {
            grid-template-columns:
              1fr;
          }

          .coupon-apply-button {
            min-height: 44px;
          }

          .coupon-applied-card {
            grid-template-columns:
              auto 1fr;
          }

          .coupon-remove-button {
            grid-column:
              1 / -1;
            width: 100%;
          }
        }

        @media (
          max-width: 430px
        ) {
          .payment-method-grid {
            grid-template-columns:
              1fr;
          }
        }

        @media (
          prefers-reduced-motion:
            reduce
        ) {
          .checkout-heading,
          .checkout-panel,
          .summary-sticky,
          .destination-card,
          .coupon-box,
          .coupon-applied-card,
          .coupon-success-mark,
          .coupon-spark,
          .coupon-spinner,
          .summary-discount-row {
            animation: none;
          }

          .payment-method-card,
          .progress-track
            span,
          .coupon-box,
          .coupon-apply-button,
          .coupon-remove-button,
          .checkout-submit {
            transition: none;
          }
        }
      `}</style>
    </>
  );
}
