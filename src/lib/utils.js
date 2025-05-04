import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export const TIME_SLOTS = [
  '08:00 AM - 09:00 AM',
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 01:00 PM',
  '01:00 PM - 02:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
];

export const COW_QUALITY_PRICES = {
  Standard: 25000,
  Medium: 30000,
  Premium: 35000,
};

export const generateRandomTimeSlot = () => {
  return TIME_SLOTS[Math.floor(Math.random() * TIME_SLOTS.length)];
};

export function cn(...inputs) {
  return twMerge(clsx(...inputs));
}
