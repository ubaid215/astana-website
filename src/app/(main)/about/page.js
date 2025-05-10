import Image from 'next/image';

export const metadata = {
  title: 'About Us - Eid ul Adha Participation System',
  description: 'Learn about our mission to make Eid ul Adha participation transparent and accessible.',
  keywords: 'about, Eid ul Adha, mission, transparency, Khanqah Saifia Murshidabad',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Hero Section with Background */}
      <div className="relative py-20 bg-cover bg-center" style={{ backgroundImage: "url('https://img.freepik.com/free-photo/moon-light-shine-through-window-into-islamic-mosque-interior_1217-2597.jpg?ga=GA1.1.1301043490.1735829953&semt=ais_hybrid&w=740')" }}>
        <div className="absolute inset-0 bg-black opacity-60"></div>
        <div className="relative max-w-7xl mx-auto px-4 text-center z-10">
          <h1 className="text-5xl font-bold text-white mb-4">About Us</h1>
          <p className="text-xl text-amber-100 max-w-3xl mx-auto">
            Building bridges through faith, technology, and community service
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Founder's Message Section */}
        <div className="mb-16 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 bg-amber-500 p-8 text-white flex flex-col justify-center items-center text-center">
              <div className="mb-6 rounded-full bg-white p-2 inline-block">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Message from Our Founder & Spiritual Guide</h2>
              <h3 className="text-3xl font-bold text-[#1e3a8a] mb-4">Hazrat Sarkar Wakeel Sahib</h3>
              <p className="text-amber-100 italic">(Damat Barakatuhum Aliyah)</p>
              <p className="mt-2 text-amber-100">Khanqah Saifia Murshidabad, Faisalabad</p>
            </div>
            
            <div className="md:w-2/3 p-8">
              <div className="prose max-w-none">
                <p className="text-gray-700 mb-4">
                  <b>Islam is not only a path of worship, but also a path of compassion, service, and selflessness. 
                  For years, I have believed and taught that true devotion lies not only in fulfilling our duties 
                  to Allah (Haqooq-UAllah), but also in serving His creation (Haqqooq-ul-Ibad).</b>
                </p>
                <p className="text-gray-700 mb-4">
                  No act of sacrifice is complete unless it brings ease to another heart.
                </p>
                <p className="text-gray-700 mb-4">
                  The purpose of this mission is to reach those forgotten homes where Eid passes like any other day 
                  without joy, without meat, without celebration. It is our duty to ensure that no soul is left behind.
                </p>
                <p className="text-gray-700">
                  I pray that through this initiative, your Qurbani becomes a means of happiness for those who have 
                  not smiled in a long time, and that every contribution becomes a step toward divine closeness and 
                  collective upliftment.
                </p>
                <p className="text-gray-700 font-medium">
                  May Allah accept our efforts, purify our intentions, and make this mission a continuous source 
                  of barakah in both worlds.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <div className="bg-amber-100 p-1 rounded-full inline-block mb-4">
              <div className="bg-amber-500 p-4 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Mission</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              At the Eid ul Adha Participation System, our mission is to provide a transparent, trustworthy, and accessible platform for individuals to participate in the sacred tradition of Eid ul Adha.
            </p>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-white rounded-xl shadow-lg p-8 mb-10">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Mission of Shabzada Muhammad Faran Zaheer Muhammadi Saifi</h3>
            <h4 className="text-xl font-semibold text-amber-600 mb-6 text-center">Eid-ul-Adha: Spreading Joy to Forgotten Homes</h4>
            
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                As the blessed month of Eid-ul-Adha approaches, many of us prepare for sacrifice with gratitude in our hearts. But one question often goes unasked: <strong>Does the joy of Eid reach every home?</strong>
              </p>
              
              <p className="mb-4">
                Our dedicated team works year-round to identify families living in extreme poverty, those who go through the entire year without a single bite of meat, not because they choose to, but because they simply cannot afford it. These are people who suffer in silence, unable to ask for help, yet deserving of dignity and care.
              </p>
              
              <p className="mb-4 font-medium">
                Our mission is to ensure that this Eid they are not forgotten.
              </p>
              
              <p className="mb-4">
                Through careful outreach, we personally visit underserved communities and hand-deliver sacrificial meat to those most in need, bringing them not only nourishment, but a sense of belonging, love, and the shared joy of Eid.
              </p>
              
              <p className="mb-4">
                This is more than charity. It is an act of <strong>Haquq-ul-Ibad</strong>, fulfilling the rights of fellow human beings. And it is the spiritual mission of our beloved <strong>Khanqah Saifia Murshidabad (Faisalabad)</strong>: <em>To bring smiles to the faces of those who have forgotten what happiness feels like.</em>
              </p>
              
              <p className="mb-4">
                This Eid, we invite you to join us in this mission. Let your Qurbani reach the ones who truly need it. Let their heartfelt prayers be your greatest reward.
              </p>
              
              <p className="text-center font-bold text-lg text-amber-700 mt-6">
                Give with love. Share with purpose. And make your sacrifice count.
              </p>
            </div>
          </div>
        </div>

        {/* Who We Are Section */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-8 mb-16">
          <div className="md:w-1/2">
            <div className="bg-amber-100 p-1 rounded-full inline-block mb-4">
              <div className="bg-amber-500 p-4 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Who We Are</h2>
            <p className="text-lg text-gray-600 mb-6">
              We are a dedicated team committed to fostering community and faith through technology. Our platform is built with integrity, leveraging modern tools to ensure your participation is seamless and secure.
            </p>
          </div>
          <div className="md:w-1/2 rounded-xl overflow-hidden shadow-lg">
            <Image 
              src="/about-img.jpg" 
              alt="Our team" 
              width={600} 
              height={400} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <div className="bg-amber-100 p-1 rounded-full inline-block mb-4">
              <div className="bg-amber-500 p-4 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Values</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Value Card 1 */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="bg-amber-100 p-4 rounded-full inline-flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Transparency</h3>
              <p className="text-gray-600">Clear processes and open communication in every aspect of our operations.</p>
            </div>
            
            {/* Value Card 2 */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="bg-amber-100 p-4 rounded-full inline-flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Trust</h3>
              <p className="text-gray-600">Building confidence through reliability and consistent delivery of our promises.</p>
            </div>
            
            {/* Value Card 3 */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="bg-amber-100 p-4 rounded-full inline-flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Community</h3>
              <p className="text-gray-600">Connecting people for a shared purpose and fostering meaningful relationships.</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-8 text-center shadow-lg">
          <h2 className="text-3xl font-bold text-white mb-4">Join Our Mission</h2>
          <p className="text-xl text-white mb-6 max-w-2xl mx-auto">
            Be part of our community and help us make Eid ul Adha participation more accessible for everyone.
          </p>
          <button className="bg-white text-amber-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-amber-50 transition-colors duration-300 shadow-md">
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}