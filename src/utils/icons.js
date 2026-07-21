import * as LucideIcons from 'lucide-react';

export const AVAILABLE_ICONS = [
  { name: 'Folder', color: 'text-gray-400', bg: 'bg-gray-400/10' },
  { name: 'Wrench', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { name: 'Monitor', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { name: 'FileText', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { name: 'Home', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { name: 'Car', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { name: 'GraduationCap', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { name: 'User', color: 'text-pink-500', bg: 'bg-pink-500/10' },
  { name: 'MoreHorizontal', color: 'text-gray-500', bg: 'bg-gray-500/10' },
  { name: 'ShoppingCart', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { name: 'Coffee', color: 'text-amber-600', bg: 'bg-amber-600/10' },
  { name: 'Heart', color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { name: 'Activity', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { name: 'Wifi', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { name: 'Smartphone', color: 'text-slate-400', bg: 'bg-slate-400/10' },
  { name: 'Plane', color: 'text-sky-500', bg: 'bg-sky-500/10' },
  { name: 'Music', color: 'text-violet-500', bg: 'bg-violet-500/10' },
  { name: 'Film', color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10' },
  { name: 'Book', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { name: 'Briefcase', color: 'text-stone-500', bg: 'bg-stone-500/10' },
  { name: 'Gift', color: 'text-red-500', bg: 'bg-red-500/10' },
  { name: 'Utensils', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { name: 'CreditCard', color: 'text-teal-500', bg: 'bg-teal-500/10' },
  { name: 'Zap', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { name: 'Scissors', color: 'text-pink-400', bg: 'bg-pink-400/10' },
  { name: 'Shirt', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { name: 'Smile', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { name: 'Droplet', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { name: 'Flame', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { name: 'Globe', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  { name: 'Shield', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { name: 'Key', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { name: 'Bus', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { name: 'Train', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { name: 'Tv', color: 'text-purple-500', bg: 'bg-purple-500/10' }
];

export const getIconComponent = (iconName) => {
  const Icon = LucideIcons[iconName];
  return Icon || LucideIcons.Folder;
};

export const getIconColor = (iconName) => {
  const iconObj = AVAILABLE_ICONS.find(i => i.name === iconName);
  return iconObj ? { color: iconObj.color, bg: iconObj.bg } : { color: 'text-blue-400', bg: 'bg-blue-500/10' };
};
