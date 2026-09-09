import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BilingualText from "@/components/BilingualText";

export default function AboutPage() {
  return (
    <>
      <Header />

      <main className="section-shell simple-page">
        <div className="eyebrow">
          <BilingualText
            en="OUR STORY"
            bn="আমাদের গল্প"
          />
        </div>

        <h1>
          <BilingualText
            en="Helping childhood grow with curiosity."
            bn="কৌতূহল আর শেখার আনন্দে শৈশবকে আরও সমৃদ্ধ করে তুলছি।"
          />
        </h1>

        <p>
          <BilingualText
            en="JIPLANCE brings thoughtful books and carefully selected lifestyle products to families across Bangladesh."
            bn="JIPLANCE বাংলাদেশের পরিবারগুলোর কাছে চিন্তাশীল বই এবং যত্নসহকারে বাছাই করা লাইফস্টাইল পণ্য পৌঁছে দেওয়ার লক্ষ্য নিয়ে কাজ করছে।"
          />
        </p>

        <p>
          <BilingualText
            en="Through JIPLANCE BOOKS, we focus on books that make learning, imagination and discovery more enjoyable. Our collection includes books designed to encourage curiosity, creativity and meaningful learning."
            bn="JIPLANCE BOOKS-এর মাধ্যমে আমরা এমন বইয়ের ওপর গুরুত্ব দিই, যা শেখা, কল্পনা এবং নতুন কিছু আবিষ্কারের অভিজ্ঞতাকে আরও আনন্দময় করে। আমাদের সংগ্রহ কৌতূহল, সৃজনশীলতা এবং অর্থবহ শেখাকে উৎসাহিত করার লক্ষ্য নিয়ে সাজানো।"
          />
        </p>

        <p>
          <BilingualText
            en="Alongside books, JIPLANCE FASHION brings stylish everyday wear with a focus on premium feel, clean finishing and comfort. Our fashion collection is selected to help you look confident, feel comfortable and enjoy quality in every detail."
            bn="বইয়ের পাশাপাশি JIPLANCE FASHION নিয়ে আসে স্টাইলিশ দৈনন্দিন পোশাক, যেখানে প্রিমিয়াম অনুভূতি, সুন্দর ফিনিশিং এবং আরামের ওপর গুরুত্ব দেওয়া হয়। আমাদের ফ্যাশন সংগ্রহ এমনভাবে বাছাই করা হয়, যাতে আপনি আত্মবিশ্বাসের সঙ্গে সুন্দর দেখাতে পারেন এবং প্রতিটি ডিটেইলে মান ও আরাম অনুভব করেন।"
          />
        </p>

        <p>
          <BilingualText
            en="From inspiring books to stylish fashion, JIPLANCE is growing with one simple goal  to bring thoughtful choices, quality and confidence into everyday life."
            bn="অনুপ্রেরণাদায়ক বই থেকে স্টাইলিশ ফ্যাশন পর্যন্ত, JIPLANCE একটি সহজ লক্ষ্য নিয়ে এগিয়ে যাচ্ছে—দৈনন্দিন জীবনে চিন্তাশীল পছন্দ, মান এবং আত্মবিশ্বাস যোগ করা।"
          />
        </p>
      </main>

      <Footer />
    </>
  );
}