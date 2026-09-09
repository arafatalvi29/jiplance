import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BilingualText from "@/components/BilingualText";

export default function ReturnsPage() {
  return (
    <>
      <Header />

      <main className="section-shell simple-page">
        <div className="eyebrow">
          <BilingualText
            en="RETURNS & REFUNDS"
            bn="রিটার্ন ও রিফান্ড"
          />
        </div>

        <h1>
          <BilingualText
            en="Simple, clear and customer-friendly returns."
            bn="সহজ, পরিষ্কার ও গ্রাহকবান্ধব রিটার্ন ব্যবস্থা।"
          />
        </h1>

        <p>
          <BilingualText
            en="We want every JIPLANCE customer to shop with confidence. Our final return, exchange and refund terms are currently being finalized and will be published here before the official launch."
            bn="আমরা চাই প্রতিটি JIPLANCE গ্রাহক আত্মবিশ্বাসের সঙ্গে কেনাকাটা করুন। আমাদের চূড়ান্ত রিটার্ন, এক্সচেঞ্জ ও রিফান্ড নীতিমালা বর্তমানে প্রস্তুত করা হচ্ছে এবং অফিসিয়াল লঞ্চের আগে এখানে প্রকাশ করা হবে।"
          />
        </p>

        <p>
          <BilingualText
            en="The final policy will clearly explain eligibility, product condition requirements, exchange procedures, refund handling and the steps customers need to follow when requesting support."
            bn="চূড়ান্ত নীতিমালায় কোন অবস্থায় রিটার্ন বা এক্সচেঞ্জ গ্রহণযোগ্য হবে, পণ্যের কী অবস্থা থাকতে হবে, এক্সচেঞ্জ প্রক্রিয়া, রিফান্ড ব্যবস্থাপনা এবং সহায়তা পাওয়ার জন্য গ্রাহককে কী কী ধাপ অনুসরণ করতে হবে—সব পরিষ্কারভাবে উল্লেখ থাকবে।"
          />
        </p>

        <p>
          <BilingualText
            en="If you need assistance with an order, please contact JIPLANCE Customer Care and keep your order information available."
            bn="কোনো অর্ডার নিয়ে সহায়তা প্রয়োজন হলে JIPLANCE Customer Care-এর সঙ্গে যোগাযোগ করুন এবং আপনার অর্ডারের তথ্য সঙ্গে রাখুন।"
          />
        </p>
      </main>

      <Footer />
    </>
  );
}