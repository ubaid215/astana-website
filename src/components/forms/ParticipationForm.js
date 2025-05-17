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
  const [pricesLoading, setPricesLoading] = useState(true);

  // Validate prices object
  const isValidPrices = (prices) => {
  if (!prices || typeof prices !== 'object') return false;

  // Handle both formats:
  // 1. New format: { standard: { price: number, message: string }, ... }
  // 2. Old format: { standard: number, medium: number, premium: number }
  
  const validateTier = (tier) => {
    if (typeof tier === 'number') {
      return tier > 0;
    }
    return (
      tier &&
      typeof tier.price === 'number' &&
      tier.price > 0 &&
      (typeof tier.message === 'string' || tier.message === undefined)
    );
  };

  return (
    validateTier(prices.standard) &&
    validateTier(prices.medium) &&
    validateTier(prices.premium)
  );
};

  // Modified useEffect for price fetching
  useEffect(() => {
  const normalizePrices = (prices) => {
    if (!prices) return null;
    
    // If prices are in old format (direct numbers), convert to new format
    if (typeof prices.standard === 'number') {
      return {
        standard: { price: prices.standard, message: '' },
        medium: { price: prices.medium, message: '' },
        premium: { price: prices.premium, message: '' }
      };
    }
    return prices;
  };

  const fetchPrices = async () => {
    setPricesLoading(true);
    try {
      const res = await fetch('/api/admin/prices');
      if (!res.ok) throw new Error(`Failed to fetch prices: ${res.status}`);
      
      const data = await res.json();
      const normalizedPrices = normalizePrices(data);
      
      if (isValidPrices(normalizedPrices)) {
        setPrices(normalizedPrices);
        setError('');
      } else {
        console.warn('Invalid prices structure:', normalizedPrices);
        setError('Price data format is invalid');
        // Set fallback prices
        setPrices({
          standard: { price: 25000, message: '' },
          medium: { price: 30000, message: '' },
          premium: { price: 35000, message: '' }
        });
      }
    } catch (err) {
      console.error('Failed to fetch prices:', err);
      setError('Failed to load prices. Using default prices.');
      setPrices({
        standard: { price: 25000, message: '' },
        medium: { price: 30000, message: '' },
        premium: { price: 35000, message: '' }
      });
    } finally {
      setPricesLoading(false);
    }
  };

  if (!isValidPrices(prices)) {
    fetchPrices();
  }
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
        setAvailableSlots(data.availableSlots || TIME_SLOTS[formData.day] || TIME_SLOTS[1]);
        console.log('[ParticipationForm] Fetched available slots:', data);
        if (formData.timeSlot && !data.availableSlots.includes(formData.timeSlot)) {
          setFormData((prev) => ({ ...prev, timeSlot: '' }));
          setError('Selected time slot is no longer available. Please choose another.');
        }
      } catch (err) {
        console.error('[ParticipationForm] Failed to fetch available slots:', err);
        setAvailableSlots(TIME_SLOTS[formData.day] || TIME_SLOTS[1]);
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
        if (isValidPrices(newPrices)) {
          setPrices(newPrices);
          setError('');
        } else {
          console.warn('[ParticipationForm] Invalid socket prices data:', newPrices);
          setPrices(null);
          setError('Invalid price data received from server. Please try again.');
        }
        setPricesLoading(false);
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
            setAvailableSlots(data.availableSlots || TIME_SLOTS[formData.day] || TIME_SLOTS[1]);
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
    if (isValidPrices(prices) && formData.cowQuality && formData.shares) {
      const priceKey = formData.cowQuality.toLowerCase();
      setFormData((prev) => ({
        ...prev,
        totalAmount: prices[priceKey].price * formData.shares,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        totalAmount: 0,
      }));
    }
  }, [formData.cowQuality, formData.shares, prices]);

  const handleSharesChange = (value) => {
    const shares = parseInt(value) || 1;
    if (formData.timeSlot === '03:30 PM - 04:00 PM' && shares > 7) {
      setError('For the 03:30 PM - 04:00 PM time slot, a maximum of 7 shares is allowed.');
      return;
    }
    setError('');
    setFormData((prev) => ({
      ...prev,
      shares: formData.timeSlot === '03:30 PM - 04:00 PM' ? Math.min(shares, 7) : shares,
      members: Array(formData.timeSlot === '03:30 PM - 04:00 PM' ? Math.min(shares, 7) : shares)
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
    setError('');
    if (value === '03:30 PM - 04:00 PM' && formData.shares > 7) {
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
    if (pricesLoading || !isValidPrices(prices)) {
      setError('Prices are not loaded. Please wait or refresh the page.');
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
 وکالت نامے کے حوالے سے اگر کوئی وضاحت درکار ہو تو لکھ کر واٹس ایپ کر دیں ۔ مجلس شرعی رہنمائی لینے کے بعد آپ کو اس کا جواب دے گی۔ 
نوٹ: اجتماعی قربانی کیلئے بکنگ کرنے کی آخری تاریخ 03 جون 2025 ہے یاد رہے ! اس تاریخ کے بعد کوئی بھی بکنگ نہیں کی جائے گی
ان شاء اللہ کریم
`;

  const englishTerms = `
**Power of Attorney for Qurbani (Sacrifice)**

I, Shakeel Ahmad, son of Muhammad Abdul Ghafur, hereby appoint my trusted representative in Pakistan to carry out all matters related to my Qurbani (sacrifice) on my behalf. This includes managing all necessary arrangements and associated expenses, such as slaughterhouse services, butcher fees, and the secure transportation of meat to eligible recipients in the community, in accordance with Islamic principles.

My representative is authorized to manage all parts of the sacrificial animal, including the meat and fat, which are traditionally consumed and should not be discarded. They may distribute my share of the meat to any deserving individuals or fellow believers, as they see fit and in line with the spirit of Qurbani.

Parts of the animal that are not typically consumed or cooked, such as certain fats or bones, should be disposed of respectfully, following appropriate practices. If any such items, including skin or other by-products, are sold, the proceeds and any surplus funds are to be handed over to the Khanqah for appropriate use.

I fully authorize my representative to take all necessary steps related to this matter, including the right to delegate authority if needed. In the event that the animal intended for my share becomes unfit for sacrifice due to illness, injury, or death, or if it is not acquired due to unforeseen circumstances such as the loss of funds, I request to be informed immediately. Any further arrangements will be made with my consent.

The money I have entrusted to you is given as an Amanah (trust). Therefore, if any loss or damage occurs without negligence or misuse, you will not be held liable, and I will not seek any compensation.

If any stakeholder passes away before the sacrifice is performed, this must be promptly reported to the Khanqah, so that the matter can be addressed appropriately by the Fatwa Council.

**Important Notes:**
- The slaughter of the sacrificial animal will be conducted strictly in accordance with Shari’ah under the supervision of the Shari’ah Council.
- For any questions or clarifications regarding this Power of Attorney, please reach out via WhatsApp. A response will be provided after consultation with the relevant authorities.
- The final date for booking communal Qurbani is June 3, 2025. No further bookings will be accepted after this date.
`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid lg:grid-cols-3 gap-8">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
        >
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">
            Qurbani Participation Form
          </h2>
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-center text-sm">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="collectorName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Collector Name
              </label>
              <Input
                id="collectorName"
                value={formData.collectorName}
                onChange={(e) => setFormData({ ...formData, collectorName: e.target.value })}
                required
                className="w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter collector name"
              />
            </div>
            <div>
              <label
                htmlFor="whatsappNumber"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                WhatsApp Number
              </label>
              <Input
                id="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                required
                className="w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="+1234567890"
              />
            </div>
            <div>
              <label
                htmlFor="country"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Country
              </label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
                className="w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter country"
              />
            </div>
            <div>
              <label
                htmlFor="cowQuality"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Cow Quality
              </label>
              <Select
                value={formData.cowQuality}
                onValueChange={(value) => setFormData({ ...formData, cowQuality: value })}
                required
                disabled={pricesLoading}
              >
                <SelectTrigger className="w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                  <SelectValue placeholder={pricesLoading ? "Loading prices..." : "Select quality"} />
                </SelectTrigger>
                <SelectContent>
                  {isValidPrices(prices) ? (
                    <>
                      <SelectItem value="Standard">
                        Standard ({prices.standard.price.toLocaleString('en-PK', { style: 'currency', currency: 'PKR' })}/share)
                        {prices.standard.message && ` - ${prices.standard.message}`}
                      </SelectItem>
                      <SelectItem value="Medium">
                        Medium ({prices.medium.price.toLocaleString('en-PK', { style: 'currency', currency: 'PKR' })}/share)
                        {prices.medium.message && ` - ${prices.medium.message}`}
                      </SelectItem>
                      <SelectItem value="Premium">
                        Premium ({prices.premium.price.toLocaleString('en-PK', { style: 'currency', currency: 'PKR' })}/share)
                        {prices.premium.message && ` - ${prices.premium.message}`}
                      </SelectItem>
                    </>
                  ) : (
                    <SelectItem value="" disabled>
                      {pricesLoading ? 'Loading prices...' : 'Price information unavailable'}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label
                htmlFor="day"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Day
              </label>
              <Select
                value={formData.day?.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, day: parseInt(value), timeSlot: '' })
                }
                required
              >
                <SelectTrigger className="w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Day 1</SelectItem>
                  <SelectItem value="2">Day 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label
                htmlFor="timeSlot"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Time Slot (Optional)
              </label>
              <Select
                value={formData.timeSlot}
                onValueChange={handleTimeSlotChange}
              >
                <SelectTrigger className="w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="">Assign Automatically</SelectItem>
                  {availableSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label
                htmlFor="shares"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Number of Shares
              </label>
              <Input
                id="shares"
                type="number"
                min="1"
                value={formData.shares}
                onChange={(e) => handleSharesChange(e.target.value)}
                required
                className="w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="1"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Total Amount
              </label>
              <Input
                value={formData.totalAmount.toLocaleString('en-PK', { style: 'currency', currency: 'PKR' })}
                disabled
                className="w-full bg-gray-100 border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Qurbani Participants
            </h3>
            {formData.members.map((member, index) => (
              <div key={index}>
                <label
                  htmlFor={`member-${index}`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Participant Name {index + 1}
                </label>
                <Input
                  id={`member-${index}`}
                  value={member}
                  onChange={(e) => handleMemberChange(index, e.target.value)}
                  required
                  className="w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={`Enter participant ${index + 1} name`}
                />
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center space-x-3">
            <input
              type="checkbox"
              id="terms"
              checked={isTermsAccepted}
              onChange={(e) => setIsTermsAccepted(e.target.checked)}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor="terms"
              className="text-sm font-medium text-gray-700"
            >
              I agree to the{' '}
              <button
                type="button"
                onClick={() => setIsTermsModalOpen(true)}
                className="text-indigo-600 hover:text-indigo-800 font-medium underline"
              >
                Terms and Conditions
              </button>
            </label>
          </div>

          <Button
            type="submit"
            className={`w-full mt-8 bg-indigo-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-indigo-700 transition-colors ${!isTermsAccepted || loading || pricesLoading || !isValidPrices(prices)
                ? 'opacity-50 cursor-not-allowed'
                : ''
              }`}
            disabled={loading || pricesLoading || !isValidPrices(prices) || !isTermsAccepted}
          >
            {loading ? 'Submitting...' : 'Submit Participation'}
          </Button>
        </form>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            Payment Account Details
          </h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Meezan Bank
              </h4>
              <p className="text-sm font-medium text-gray-600">IBAN Number:</p>
              <p className="text-sm text-gray-800">
                PK40MEZN0004170110884115
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Western Union
              </h4>
              <p className="text-sm font-medium text-gray-600">
                Receiver Details:
              </p>
              <p className="text-sm text-gray-800">
                <span className="font-medium">Name:</span> Muhammad Ubaidullah
              </p>
              <p className="text-sm text-gray-800">
                <span className="font-medium">ID Card Number:</span> 35501-0568066-3
              </p>
              <p className="text-sm text-gray-800">
                <span className="font-medium">Phone:</span> +92321-7677062
              </p>
            </div>
          </div>
        </div>
      </div>

      {isTermsModalOpen && (
        <div className="fixed inset-0 bg-gradient-to-b from-black/70 to-gray-900/70 flex items-center justify-center z-50 p-4 sm:p-6 transition-opacity duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col transform transition-all duration-300 scale-95 animate-modal-open">
            <div className="p-8 pb-0">
              <h3 className="text-3xl font-bold text-teal-800 font-serif tracking-tight">
                Terms and Conditions
              </h3>
            </div>

            <div className="flex-1 px-8 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-teal-200 scrollbar-track-gray-50">
              <div className="flex space-x-3 mb-8">
                <button
                  onClick={() => setTermsLanguage('Urdu')}
                  className={`flex-1 py-3 px-6 rounded-full text-base font-medium transition-all duration-200 shadow-sm ${termsLanguage === 'Urdu'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-gray-100 text-teal-800 hover:bg-teal-50 hover:text-teal-900'
                    }`}
                >
                  Urdu
                </button>
                <button
                  onClick={() => setTermsLanguage('English')}
                  className={`flex-1 py-3 px-6 rounded-full text-base font-medium transition-all duration-200 shadow-sm ${termsLanguage === 'English'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-gray-100 text-teal-800 hover:bg-teal-50 hover:text-teal-900'
                    }`}
                >
                  English
                </button>
              </div>

              <div className={`${termsLanguage === 'Urdu' ? 'font-arabic' : 'font-sans'} text-gray-700 leading-relaxed text-base`}>
                {termsLanguage === 'Urdu' ? (
                  <div className="space-y-6">
                    <h4 className="text-xl font-semibold text-teal-700 font-arabic">وکالت نامہ</h4>
                    <p className="whitespace-pre-wrap text-gray-600">{urduTerms}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <h4 className="text-xl font-semibold text-teal-700">
                      Power of Attorney for Qurbani (Sacrifice)
                    </h4>
                    {englishTerms.split('\n\n').map((paragraph, index) => (
                      <div key={index} className="space-y-2">
                        {paragraph.startsWith('**') ? (
                          <span className="block font-semibold text-gray-800">
                            {paragraph.replace(/\*\*/g, '')}
                          </span>
                        ) : paragraph.startsWith('-') ? (
                          <ul className="list-disc pl-6 text-gray-600">
                            {paragraph.split('\n').map((item, i) => (
                              <li key={i} className="mb-2">{item.replace(/^- /, '')}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-600">{paragraph}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 border-t border-teal-100 bg-teal-50/50 rounded-b-3xl">
              <Button
                onClick={() => setIsTermsModalOpen(false)}
                className="w-full bg-teal-600 text-white rounded-full py-3.5 text-base font-medium hover:bg-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}