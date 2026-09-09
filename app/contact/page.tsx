import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { siteConfig } from "@/lib/config";

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="section-shell simple-page">
        <div className="eyebrow">CONTACT JIPLANCE</div>
        <h1>We’re here to help.</h1>
        <div className="contact-cards">
          <a href={`tel:${siteConfig.contact.phone}`}><strong>Phone</strong><span>{siteConfig.contact.phone}</span></a>
          <a href={`mailto:${siteConfig.contact.email}`}><strong>Email</strong><span>{siteConfig.contact.email}</span></a>
          <a href={`https://wa.me/88${siteConfig.contact.whatsapp}`}><strong>WhatsApp</strong><span>{siteConfig.contact.whatsapp}</span></a>
        </div>
      </main>
      <Footer />
    </>
  );
}
