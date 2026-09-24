import React from 'react';
import { Brush, Coffee, Droplet, Footprints, House, Shirt, Target, Utensils } from 'lucide-react-native';

// فیلد icon فعالیت‌های عادت در بک‌اند اسم آیکن lucide است (مثلاً 'brush')، نه
// ایموجی — قبلاً مستقیم به‌صورت متن رندر می‌شد و کلمه از دایره بیرون می‌زد.
const ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  coffee: Coffee,
  droplet: Droplet,
  brush: Brush,
  footprints: Footprints,
  utensils: Utensils,
  shirt: Shirt,
  home: House,
};

export const HabitActivityIcon: React.FC<{ name?: string; size: number; color: string }> = ({ name, size, color }) => {
  const Icon = (name && ICONS[name]) || Target;
  return <Icon size={size} color={color} />;
};
