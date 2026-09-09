import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BilingualText from "@/components/BilingualText";
import { siteConfig } from "@/lib/config";

export default function ShippingPage() {
  return (
    <>
      <Header />

      <main className="section-shell simple-page">
        <div className="eyebrow">
          <BilingualText
            en="DELIVERY"
            bn="ডেলিভারি"
          />
        </div>

        <h1>
          <BilingualText
            en="Shipping across Bangladesh."
            bn="সারা বাংলাদেশে ডেলিভারি।"
          />
        </h1>

        <p>
          <BilingualText
            en={
              <>
                Dhaka delivery:{" "}
                <strong>
                  ৳{siteConfig.delivery.dhaka}
                </strong>
                . Outside Dhaka:{" "}
                <strong>
                  ৳{siteConfig.delivery.outsideDhaka}
                </strong>
                .
              </>
            }
            bn={
              <>
                ঢাকার ভিতরে ডেলিভারি চার্জ:{" "}
                <strong>
                  ৳{siteConfig.delivery.dhaka}
                </strong>
                । ঢাকার বাইরে:{" "}
                <strong>
                  ৳{siteConfig.delivery.outsideDhaka}
                </strong>
                ।
              </>
            }
          />
        </p>

        <p>
          <BilingualText
            en={
              <>
                Our planned courier partner is{" "}
                <strong>
                  {siteConfig.delivery.courier}
                </strong>
                . We aim to deliver your order safely
                and conveniently to your address.
              </>
            }
            bn={
              <>
                আমাদের পরিকল্পিত কুরিয়ার পার্টনার{" "}
                <strong>
                  {siteConfig.delivery.courier}
                </strong>
                । আপনার অর্ডার নিরাপদ ও সুবিধাজনকভাবে
                আপনার ঠিকানায় পৌঁছে দেওয়াই আমাদের লক্ষ্য।
              </>
            }
          />
        </p>

        <p>
          <BilingualText
            en="Delivery time may vary depending on your location, courier operations and other unavoidable circumstances."
            bn="আপনার অবস্থান, কুরিয়ার কার্যক্রম এবং অন্যান্য অনিবার্য পরিস্থিতির কারণে ডেলিভারির সময় কিছুটা পরিবর্তিত হতে পারে।"
          />
        </p>
      </main>

      <Footer />
    </>
  );
}