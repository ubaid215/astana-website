'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { TIME_SLOTS } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';

export default function ParticipationForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const { socket, prices, setPrices } = useSocket();
  const [formData, setFormData] = useState({
    collectorName: '',
    whatsappNumber: '',
    country: '',
    cowQuality: '',
    timeSlot: '',
    day: '',
    shares: 1,
    members: [''],
    totalAmount: 0,
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [termsLanguage, setTermsLanguage] = useState('Urdu');

  // Fetch prices on initial load
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('/api/admin/prices');
        if (!res.ok) throw new Error('Failed to fetch prices');
        const data = await res.json();
        console.log('[ParticipationForm] Fetched initial prices:', data);
        setPrices(data);
      } catch (err) {
        console.error('[ParticipationForm] Failed to fetch prices:', err);
      }
    };

    if (!prices) fetchPrices();
  }, [prices, setPrices]);

  // Fetch available slots
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      try {
        const res = await fetch('/api/slots/available', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            day: formData.day,
            cowQuality: formData.cowQuality,
            country: formData.country,
          }),
        });
        if (!res.ok) throw new Error('Failed to fetch available slots');
        const data = await res.json();
        setAvailableSlots(data.availableSlots || TIME_SLOTS);
        console.log('[ParticipationForm] Fetched available slots:', data);
        // Reset timeSlot if it's no longer available
        if (formData.timeSlot && !data.availableSlots.includes(formData.timeSlot)) {
          setFormData((prev) => ({ ...prev, timeSlot: '' }));
          setError('Selected time slot is no longer available. Please choose another.');
        }
      } catch (err) {
        console.error('[ParticipationForm] Failed to fetch available slots:', err);
        setAvailableSlots(TIME_SLOTS);
      }
    };

    if (formData.day && formData.cowQuality && formData.country) {
      fetchAvailableSlots();
    }
  }, [formData.day, formData.cowQuality, formData.country]);

  // Listen for price and slot updates via Socket.IO
  useEffect(() => {
    if (socket) {
      socket.on('pricesUpdated', (newPrices) => {
        console.log('[ParticipationForm] Prices updated via Socket.IO:', newPrices);
        setPrices(newPrices);
      });

      socket.on('slotCreated', (newSlot) => {
        if (
          newSlot.day === parseInt(formData.day) &&
          newSlot.cowQuality === formData.cowQuality &&
          newSlot.country === formData.country
        ) {
          setAvailableSlots((prev) => {
            const totalShares = newSlot.participants.reduce((sum, p) => sum + p.shares, 0);
            if (totalShares >= 7) {
              return prev.filter((slot) => slot !== newSlot.timeSlot);
            }
            return prev.includes(newSlot.timeSlot) ? prev : [...prev, newSlot.timeSlot].sort();
          });
        } else if (
          newSlot.day === parseInt(formData.day) &&
          newSlot.country === formData.country
        ) {
          setAvailableSlots((prev) => prev.filter((slot) => slot !== newSlot.timeSlot));
        }
        // Check if current timeSlot is still valid
        if (formData.timeSlot === newSlot.timeSlot) {
          const fetchAvailableSlots = async () => {
            try {
              const res = await fetch('/api/slots/available', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  day: formData.day,
                  cowQuality: formData.cowQuality,
                  country: formData.country,
                }),
              });
              if (!res.ok) throw new Error('Failed to fetch available slots');
              const data = await res.json();
              if (!data.availableSlots.includes(formData.timeSlot)) {
                setFormData((prev) => ({ ...prev, timeSlot: '' }));
                setError('Selected time slot is no longer available. Please choose another.');
              }
            } catch (err) {
              console.error('[ParticipationForm] Failed to refresh slots:', err);
            }
          };
          fetchAvailableSlots();
        }
      });

      socket.on('slotDeleted', ({ slotId }) => {
        const fetchAvailableSlots = async () => {
          try {
            const res = await fetch('/api/slots/available', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                day: formData.day,
                cowQuality: formData.cowQuality,
                country: formData.country,
              }),
            });
            if (!res.ok) throw new Error('Failed to fetch available slots');
            const data = await res.json();
            setAvailableSlots(data.availableSlots || TIME_SLOTS);
          } catch (err) {
            console.error('[ParticipationForm] Failed to refresh slots:', err);
          }
        };
        if (formData.day && formData.cowQuality && formData.country) {
          fetchAvailableSlots();
        }
      });

      return () => {
        socket.off('pricesUpdated');
        socket.off('slotCreated');
        socket.off('slotDeleted');
      };
    }
  }, [socket, setPrices, formData.day, formData.cowQuality, formData.country, formData.timeSlot]);

  // Update total amount
  useEffect(() => {
    if (prices && formData.cowQuality && formData.shares) {
      const priceKey = formData.cowQuality.toLowerCase();
      if (prices[priceKey]) {
        setFormData((prev) => ({
          ...prev,
          totalAmount: prices[priceKey] * formData.shares,
        }));
      }
    }
  }, [formData.cowQuality, formData.shares, prices]);

  const handleSharesChange = (value) => {
    const shares = parseInt(value) || 1;
    if (formData.timeSlot === '03:00 PM - 04:00 PM' && shares > 7) {
      setError('For the 03:00 PM - 04:00 PM time slot, a maximum of 7 shares is allowed.');
      return;
    }
    setError('');
    setFormData((prev) => ({
      ...prev,
      shares: formData.timeSlot === '03:00 PM - 04:00 PM' ? Math.min(shares, 7) : shares,
      members: Array(formData.timeSlot === '03:00 PM - 04:00 PM' ? Math.min(shares, 7) : shares)
        .fill('')
        .map((_, i) => prev.members[i] || ''),
    }));
  };

  const handleMemberChange = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.map((m, i) => (i === index ? value : m)),
    }));
  };

  const handleTimeSlotChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      timeSlot: value,
    }));
    setError(''); // Clear any previous errors
    // Reset shares to 1 if switching to 03:00 PM - 04:00 PM to enforce the limit
    if (value === '03:00 PM - 04:00 PM' && formData.shares > 7) {
      setFormData((prev) => ({
        ...prev,
        shares: 7,
        members: Array(7).fill('').map((_, i) => prev.members[i] || ''),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      setError('Please log in to submit the form');
      return;
    }
    if (formData.members.some((m) => !m)) {
      setError('Please fill all member names');
      return;
    }
    if (!isTermsAccepted) {
      setError('Please accept the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/participation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: session.user.id,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.error.includes('Not enough capacity') || errorData.error.includes('No available slots')) {
          setError(errorData.error);
        } else {
          throw new Error(errorData.error || 'Submission failed');
        }
      } else {
        router.push('/profile');
      }
    } catch (err) {
      setError(err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const urduTerms = `
وکالت نامہ
میں شکیل احمد ولد محمد عبدالغفور کو بیرون ملک یعنی پاکستان میں اپنی قربانی اور قربانی سے متعلق کسی بھی طرح کا خرچ ( مثلا سلائر باؤس یا قصاب اور مسلمانوں تک اپنی قربانی کا گوشت بحفاظت پہنچانے کے لئے کرائے وغیرہ کے اخراجات کرنے اور قربانی کے جانور کے گوشت چربی وغیرہ جس کے کھانے کا معمول ہے چھوڑی نہیں جاتی، اس میں سے میرے حصے کے مطابق گوشت وغیرہ مسلمانوں میں سے جسے چاہے جیسے چاہے تقسیم کرنے، ایسی چربی و ہڈی جونہ کھائی جاتی اور نہ پکائی جاتی ہے، اسے اگر بیچنے کی ضرورت پڑےبیچ کر حاصل ہونے والی رقم قربانی کے جانور کی کھال اور قربانی میں سے بچی ہوئی رقم خانقاہ عالیہ کو دینے کا وکیل مطلق یعنی ایسا با اختیار نائب بناتا ہوں کہ مذکورہ تمام کام وہ خود سر انجام دیں یا کسی اور کو اسی طرح کا با اختیار کر کے سونپ دیں ۔ اگر میرے حصے والی قربانی کا جانور کسی حادثے یا مرض وغیرہ کے سبب قربانی کے قابل نہ رہا یا کسی وجہ سے مر گیا یا خریداری کے لئے جاتے ہوئے منڈی میں رقم چھن جانیکی صورت میں جانور خریدا ہی نہ جا سکا تو مجھے زندہ یا مردہ جانور کی اطلاع دی جائے اور آئندہ کے معاملات میری اجازت سے طے کئے جائیں، آپ کے ہاتھ میں میری رقم امانت ہے ، اگر بلا کسی غلط استعمال کے آپ سے رقم یا جانور ضائع ہو گیا تو اس کا تاوان آپ کے ذمہ نہ ہو گا اور میں مطالبہ نہ کروں گا۔  
اگر کسی حصہ دار کا قربانی سے قبل خدانخواستہ انتقال ہو جائے تو اس کے انتقال کی اطلاع خانقاہ عالیہ کو ضرور دی جائے تاکہ آگے کے معاملات دار الافتاء  سے رہنمائی لیکر طے کئے جاسکیں۔ 
نوٹ : قربانی کے جانوروں کے ذبح کی خدمات شرعی تقاضوں کے مطابق ذبح کے معاملات مجلس کی نگرانی میں ہونگے ۔ 
Ludlow وکالت نامے کے حوالے سے اگر کوئی وضاحت درکار ہو تو لکھ کر واٹس ایپ کر دیں ۔ مجلس شرعی رہنمائی لینے کے بعد آپ کو اس کا جواب دے گی۔ 
نوٹ: اجتماعی قربانی کیلئے بکنگ کرنے کی آخری تاریخ 03 جون 2025 ہے یاد رہے ! اس تاریخ کے بعد کوئی بھی بکنگ نہیں کی جائے گی
ان شاء اللہ کریم
`;

  const englishTerms = `
**Authorization Letter**

I appoint Shakeel Ahmad, son of Muhammad Abdul Ghafoor, as my absolute representative (authorized agent) to perform or delegate the following tasks related to my Qurbani in Pakistan or abroad:
- Handle all expenses related to the Qurbani, such as slaughtering fees, transportation costs to safely deliver the meat to Muslims, and other associated costs.
- Distribute the meat, fat, and other edible portions of the Qurbani animal, according to my share, to any Muslims of his choice in any manner he deems appropriate.
- For inedible fat and bones that are neither consumed nor cooked, sell them if necessary, and donate the proceeds, along with the animal’s hide and any remaining Qurbani funds, to Khanqah Aalia.
- He may perform these tasks himself or appoint another authorized agent with the same authority.

In case the Qurbani animal allocated to my share becomes unfit for sacrifice due to an accident, illness, or other reasons, or if it dies, or if the funds are lost (e.g., stolen in the market) and the animal cannot be purchased, I should be informed about the status of the animal (alive or dead). Future actions will be decided with my consent. The funds entrusted to you are held in trust, and if they are lost without any misuse on your part, you will not be liable for compensation, and I will not make any claims.

If a shareholder passes away before the Qurbani, Khanqah Aalia must be informed of their demise so that further actions can be determined with guidance from Dar-ul-Ifta.

**Note**: The slaughtering services for Qurbani animals will be conducted under the supervision of the council, in accordance with Shariah requirements.

For any clarification regarding this authorization letter, please send a written query via WhatsApp. The council will respond after seeking Shariah guidance.

**Note**: The last date for booking collective Qurbani is June 3, 2025. Please note that no bookings will be accepted after this date.

*Insha’Allah Kareem*
`;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex flex-col lg:flex-row lg:space-x-6 space-y-6 lg:space-y-0">
        <form onSubmit={handleSubmit} className="flex-1 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-3xl font-bold text-primary text-center">Participation Form</h2>
          {error && <p className="text-red-600 text-center">{error}</p>}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="collectorName" className="block text-sm font-medium">Collector Name</label>
              <Input
                id="collectorName"
                value={formData.collectorName}
                onChange={(e) => setFormData({ ...formData, collectorName: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="whatsappNumber" className="block text-sm font-medium">WhatsApp Number</label>
              <Input
                id="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium">Country</label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="cowQuality" className="block text-sm font-medium">Cow Quality</label>
              <Select
                value={formData.cowQuality}
                onValueChange={(value) => setFormData({ ...formData, cowQuality: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  {prices ? (
                    <>
                      <SelectItem value="Standard">Standard ({prices.standard.toLocaleString()}/share)</SelectItem>
                      <SelectItem value="Medium">Medium ({prices.medium.toLocaleString()}/share)</SelectItem>
                      <SelectItem value="Premium">Premium ({prices.premium.toLocaleString()}/share)</SelectItem>
                    </>
                  ) : (
                    <SelectItem value="loading">Loading prices...</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="timeSlot" className="block text-sm font-medium">Time Slot (Optional)</label>
              <Select
                value={formData.timeSlot}
                onValueChange={handleTimeSlotChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Assign Automatically</SelectItem>
                  {availableSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="day" className="block text-sm font-medium">Day</label>
              <Select
                value={formData.day?.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, day: parseInt(value) })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Day 1</SelectItem>
                  <SelectItem value="2">Day 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="shares" className="block text-sm font-medium">Number of Shares</label>
              <Input
                id="shares"
                type="number"
                min="1"
                value={formData.shares}
                onChange={(e) => handleSharesChange(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Total Amount</label>
              <Input
                value={formData.totalAmount.toLocaleString()}
                disabled
                className="bg-gray-100"
              />
            </div>
          </div>

          <div className="space-y-4 mt-4">
            {formData.members.map((member, index) => (
              <div key={index}>
                <label htmlFor={`member-${index}`} className="block text-sm font-medium">Name Of Qurbani Recipient: {index + 1}</label>
                <Input
                  id={`member-${index}`}
                  value={member}
                  onChange={(e) => handleMemberChange(index, e.target.value)}
                  required
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center space-x-2">
            <input
              type="checkbox"
              id="terms"
              checked={isTermsAccepted}
              onChange={(e) => setIsTermsAccepted(e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="terms" className="text-sm font-medium">
              I agree to the{' '}
              <button
                type="button"
                onClick={() => setIsTermsModalOpen(true)}
                className="text-primary underline hover:text-primary-dark"
              >
                Terms and Conditions
              </button>
            </label>
          </div>

          <Button
            type="submit"
            className={`w-full bg-primary text-white mt-4 ${!isTermsAccepted || loading || !prices ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading || !prices || !isTermsAccepted}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </Button>
        </form>

        <div className="lg:w-80 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-primary mb-4">Payment Account Details</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold flex items-center">Meezan Bank</h4>
              <p className="text-sm font-medium">IBAN Number:</p>
              <p className="text-sm">PK40MEZN0004170110884115</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-primary">Western Union</h4>
              <p className="text-sm font-medium"><strong>Payment send by Name or Western Union</strong></p>
              <p>Receiver Name</p>
              <p className="text-sm"><b>Name:</b> Muhammad Ubaidullah</p>
              <p className="text-sm font-medium"><b>ID Card Number:</b></p>
              <p className="text-sm">35501-0568066-3</p>
              <p className="text-sm font-medium"><b>Phone:</b> +92321-7677062</p>
            </div>
          </div>
        </div>
      </div>

      {isTermsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-primary mb-4">Terms and Conditions</h3>
            <div className="mb-4 flex space-x-2">
              <button
                onClick={() => setTermsLanguage('Urdu')}
                className={`px-4 py-2 rounded ${termsLanguage === 'Urdu' ? 'bg-primary text-white' : 'bg-gray-200'}`}
              >
                Urdu
              </button>
              <button
                onClick={() => setTermsLanguage('English')}
                className={`px-4 py-2 rounded ${termsLanguage === 'English' ? 'bg-primary text-white' : 'bg-gray-200'}`}
              >
                English
              </button>
            </div>
            <div className="text-sm text-gray-700 mb-6 whitespace-pre-wrap">
              {termsLanguage === 'Urdu' ? urduTerms : englishTerms}
            </div>
            <Button
              onClick={() => setIsTermsModalOpen(false)}
              className="w-full bg-primary text-white"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}