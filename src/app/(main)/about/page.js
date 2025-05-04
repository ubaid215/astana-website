export const metadata = {
    title: 'About Us - Eid ul Adha Participation System',
    description: 'Learn about our mission to make Eid ul Adha participation transparent and accessible.',
    keywords: 'about, Eid ul Adha, mission, transparency',
  };
  
  export default function AboutPage() {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-primary text-center mb-8">About Us</h1>
          <div className="prose max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold text-secondary mb-4">Our Mission</h2>
            <p className="text-gray-600 mb-6">
              At the Eid ul Adha Participation System, our mission is to provide a transparent, trustworthy, and accessible platform for individuals to participate in the sacred tradition of Eid ul Adha. We aim to simplify the process, ensuring every contribution is meaningful and impactful.
            </p>
            <h2 className="text-2xl font-semibold text-secondary mb-4">Who We Are</h2>
            <p className="text-gray-600 mb-6">
              We are a dedicated team committed to fostering community and faith through technology. Our platform is built with integrity, leveraging modern tools to ensure your participation is seamless and secure.
            </p>
            <h2 className="text-2xl font-semibold text-secondary mb-4">Our Values</h2>
            <ul className="list-disc list-inside text-gray-600 mb-6">
              <li>Transparency: Clear processes and open communication.</li>
              <li>Trust: Building confidence through reliability.</li>
              <li>Community: Connecting people for a shared purpose.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }