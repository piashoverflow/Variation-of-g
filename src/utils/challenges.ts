import { Challenge } from '../types';
import { THEORETICAL_HALF_TRANSIT_SECONDS } from '../physics/constants';

export const challengesList: Challenge[] = [
  {
    id: 'transit-42',
    targetMode: 'tunnel',
    titleEn: 'Challenge 1: The 42-Minute Transit Time',
    titleBn: 'চ্যালেঞ্জ ১: ৪২ মিনিটের অভ্যন্তরীণ পরিভ্রমণকাল',
    descEn: 'Drop a passenger capsule from the North Pole (y = +R). Watch it accelerate to ~7.9 km/s at the core and arrive at the South Pole (y = -R) in exactly ~42.3 minutes (T/2).',
    descBn: 'উত্তর মেরু (y = +R) থেকে ক্যাপসুলটি ছেড়ে দিন। কেন্দ্রে সর্বোচ্চ বেগ ~৭.৯ কিমি/সেকেন্ড অতিক্রম করে ঠিক ~৪২.৩ মিনিটে (T/2) দক্ষিণ মেরুতে পৌঁছানো পর্যবেক্ষণ করুন।',
    hintEn: 'Set release position to 1.0 R, click Play, and increase Time Speed (e.g. 300x or 600x) to watch the timer reach ~42m 19s.',
    hintBn: 'রিলিজ অবস্থান ১.০ R এ রেখে প্লে চাপুন এবং সময় ত্বরণ বাড়িয়ে (৩০০x বা ৬০০x) স্টপওয়াচে ৪২ মিনিট ২০ সেকেন্ড লক্ষ্য করুন।',
    checkCompleted: ({ tunnel }) => {
      // Completed if half transit was detected within ±60s of theoretical T/2 (2533s)
      return tunnel.halfTransitDetected && tunnel.firstCrossingTime !== null &&
        Math.abs(tunnel.firstCrossingTime - THEORETICAL_HALF_TRANSIT_SECONDS) < 80;
    }
  },
  {
    id: 'earth-shielding',
    targetMode: 'explorer',
    titleEn: 'Challenge 2: Earth Interior Shielding & Core Weightlessness',
    titleBn: 'চ্যালেঞ্জ ২: ভূ-অভ্যন্তরে মহাকর্ষীয় শিল্ডিং ও কেন্দ্রে ওজনহীনতা',
    descEn: 'Place the test object deep inside Earth (depth d > 1,000 km or at the core r < 0.2 R). Observe how Newton\'s Shell Theorem makes the outer shell inactive (net force = 0), and g drops linearly to 0.00 m/s² at the center!',
    descBn: 'টেস্ট অবজেক্টটিকে ভূ-অভ্যন্তরে গভীরতায় (d > ১০০০ কিমি) বা কেন্দ্রে (r < ০.২ R) নিয়ে যান। লক্ষ্য করুন কিভাবে নিউটনের শেল উপপাদ্য অনুযায়ী বাইরের খোলকটি নিষ্ক্রিয় (লব্ধি বল = ০) হয়ে যায় এবং কেন্দ্রে g কমে ঠিক ০.০০ m/s² হয়!',
    hintEn: 'Drag the test object inside the Earth cutaway or select the Earth Core preset, and watch the outer shell gold shielding highlight and g drop.',
    hintBn: 'টেস্ট অবজেক্টটি পৃথিবীর ভেতরের দিকে টেনে নিয়ে যান অথবা "পৃথিবীর কেন্দ্র" প্রিসেট নির্বাচন করে শিল্ডিং ও g এর মান পর্যবেক্ষণ করুন।',
    checkCompleted: ({ explorer }) => {
      // Completed if placed inside Earth (r < 0.6 R) to experience interior shielding
      return explorer.r < 0.6 * 6371000;
    }
  },
  {
    id: 'weightless-17x',
    targetMode: 'rotation',
    titleEn: 'Challenge 3: The 17× Equator Weightless Experiment',
    titleBn: 'চ্যালেঞ্জ ৩: বিষুবরেখায় ১৭ গুণ গতিতে ওজনহীনতা পরীক্ষা',
    descEn: 'Set the latitude to 0° (Equator). Gradually increase Earth rotation speed until the centrifugal deductible cancels gravity (apparent scale reading drops to 0.0 N). Confirm multiplier is ~17×.',
    descBn: 'অক্ষাংশ ০° (বিষুবরেখা) নির্বাচন করুন। এরপর ঘূর্ণন বেগ গুণক বাড়িয়ে দেখুন ঠিক ১৭ গুণ গতিতে স্প্রিং স্কেলের পাঠ ০.০ নিউটন হয়ে মানবমূর্তিটি শূন্যে ভেসে ওঠে কিনা।',
    hintEn: 'Slide latitude to 0° and adjust rotation speed slider to approximately 17.0x.',
    hintBn: 'অক্ষাংশ ০° তে রেখে ঘূর্ণন গতি ১৭.০x এ নিয়ে যান।',
    checkCompleted: ({ rotation }) => {
      return rotation.latitudeDeg <= 5 && rotation.rotationMultiplier >= 16.8 && rotation.rotationMultiplier <= 17.3;
    }
  }
];
