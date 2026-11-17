import React from 'react';

interface VocabIllustrationProps {
  illustrationKey?: string;
  size?: number;
  className?: string;
}

export const ILLUSTRATION_KEYS = [
  'apple', 'book', 'pen', 'car', 'bus', 'train', 'plane', 'ship',
  'taxi', 'bicycle', 'sun', 'moon', 'clock', 'phone', 'umbrella', 'shirt',
  'shoes', 'key', 'dog', 'cat', 'fish', 'egg', 'bread', 'coffee',
  'heart', 'eye', 'tooth', 'orange', 'banana', 'hospital', 'bed', 'bag',
] as const;

export const VocabIllustration: React.FC<VocabIllustrationProps> = ({
  illustrationKey,
  size = 72,
  className = '',
}) => {
  if (!illustrationKey) return null;

  const common = {
    width: size,
    height: size,
    viewBox: '0 0 80 80',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className,
    'aria-hidden': true as const,
  };

  switch (illustrationKey) {
    case 'apple':
      return (
        <svg {...common}>
          <path d="M40 22C34 19 22 22 20 35C18 48 25 63 34 64C37 64.5 39 62.5 40 62.5C41 62.5 43 64.5 46 64C55 63 62 48 60 35C58 22 46 19 40 22Z" fill="#EF4444" />
          <path d="M40 22C40 16 42 12 46 10" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M42 17C48 11 55 13 54 19C49 21 44 20 42 17Z" fill="#22C55E" />
          <ellipse cx="29" cy="34" rx="4" ry="8" transform="rotate(-15 29 34)" fill="#FCA5A5" opacity="0.55" />
        </svg>
      );
    case 'book':
      return (
        <svg {...common}>
          <rect x="16" y="16" width="44" height="48" rx="5" fill="#1D4ED8" />
          <rect x="22" y="16" width="38" height="48" rx="4" fill="#3B82F6" />
          <rect x="20" y="54" width="40" height="8" rx="2" fill="#F8FAFC" />
          <rect x="28" y="25" width="24" height="5" rx="2" fill="#FEF3C7" />
          <rect x="28" y="34" width="18" height="4" rx="2" fill="#DBEAFE" />
        </svg>
      );
    case 'pen':
      return (
        <svg {...common}>
          <path d="M56 16L64 24L30 58L18 62L22 50L56 16Z" fill="#0F766E" />
          <path d="M50 22L58 30" stroke="#FCD34D" strokeWidth="4" />
          <path d="M22 50L30 58L18 62L22 50Z" fill="#FDE68A" />
          <circle cx="19" cy="61" r="2" fill="#1E293B" />
        </svg>
      );
    case 'car':
      return (
        <svg {...common}>
          <path d="M18 43L25 28C26.5 25 29 24 32 24H48C51 24 53.5 25 55 28L62 43H18Z" fill="#2563EB" />
          <rect x="12" y="40" width="56" height="15" rx="6" fill="#1D4ED8" />
          <path d="M27 30H53L56 39H24L27 30Z" fill="#DBEAFE" />
          <circle cx="24" cy="56" r="7" fill="#1E293B" />
          <circle cx="24" cy="56" r="3" fill="#CBD5E1" />
          <circle cx="56" cy="56" r="7" fill="#1E293B" />
          <circle cx="56" cy="56" r="3" fill="#CBD5E1" />
        </svg>
      );
    case 'bus':
      return (
        <svg {...common}>
          <rect x="12" y="22" width="56" height="34" rx="7" fill="#F59E0B" />
          <rect x="17" y="28" width="13" height="11" rx="2" fill="#E0F2FE" />
          <rect x="33" y="28" width="13" height="11" rx="2" fill="#E0F2FE" />
          <rect x="49" y="28" width="14" height="11" rx="2" fill="#E0F2FE" />
          <rect x="12" y="43" width="56" height="4" fill="#B45309" />
          <circle cx="24" cy="57" r="6.5" fill="#1E293B" />
          <circle cx="56" cy="57" r="6.5" fill="#1E293B" />
        </svg>
      );
    case 'taxi':
      return (
        <svg {...common}>
          <rect x="33" y="18" width="14" height="6" rx="2" fill="#1E293B" />
          <path d="M18 42L25 27C26.5 24.5 29 24 32 24H48C51 24 53.5 24.5 55 27L62 42H18Z" fill="#FACC15" />
          <rect x="12" y="40" width="56" height="15" rx="6" fill="#EAB308" />
          <rect x="22" y="45" width="36" height="4" fill="#1E293B" strokeDasharray="4 4" />
          <circle cx="24" cy="56" r="6.5" fill="#1E293B" />
          <circle cx="56" cy="56" r="6.5" fill="#1E293B" />
        </svg>
      );
    case 'train':
      return (
        <svg {...common}>
          <rect x="18" y="16" width="44" height="42" rx="8" fill="#0F766E" />
          <rect x="24" y="24" width="32" height="15" rx="3" fill="#CCFBF1" />
          <circle cx="28" cy="48" r="4" fill="#FDE047" />
          <circle cx="52" cy="48" r="4" fill="#FDE047" />
          <path d="M26 58L18 67M54 58L62 67" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'plane':
      return (
        <svg {...common}>
          <path d="M40 12L46 34L68 44V50L46 44V58L54 64V68L40 64L26 68V64L34 58V44L12 50V44L34 34L40 12Z" fill="#0284C7" />
          <circle cx="40" cy="24" r="3" fill="#E0F2FE" />
        </svg>
      );
    case 'ship':
      return (
        <svg {...common}>
          <rect x="28" y="20" width="24" height="18" rx="3" fill="#F8FAFC" stroke="#64748B" strokeWidth="2" />
          <rect x="36" y="12" width="8" height="8" fill="#EF4444" />
          <path d="M12 40H68L60 56H20L12 40Z" fill="#1E40AF" />
          <path d="M10 62C16 58 22 65 28 62C34 58 40 65 46 62C52 58 58 65 70 62" stroke="#0EA5E9" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );
    case 'bicycle':
      return (
        <svg {...common}>
          <circle cx="22" cy="52" r="12" stroke="#0F172A" strokeWidth="4" />
          <circle cx="58" cy="52" r="12" stroke="#0F172A" strokeWidth="4" />
          <path d="M22 52L36 32H52L58 52M36 32L42 52H22" stroke="#E11D48" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'sun':
      return (
        <svg {...common}>
          <circle cx="40" cy="40" r="16" fill="#F59E0B" />
          <circle cx="40" cy="40" r="12" fill="#FBBF24" />
          <path d="M40 10V18M40 62V70M10 40H18M62 40H70M19 19L25 25M55 55L61 61M61 19L55 25M25 55L19 61" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'moon':
      return (
        <svg {...common}>
          <path d="M48 16C34 18 24 30 24 44C24 58 35 66 49 66C55 66 60 64 64 60C51 61 40 52 40 39C40 29 44 21 48 16Z" fill="#FACC15" />
          <circle cx="56" cy="24" r="3" fill="#FDE047" />
          <circle cx="62" cy="36" r="2" fill="#FDE047" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="40" cy="40" r="26" fill="#F8FAFC" stroke="#0F766E" strokeWidth="5" />
          <circle cx="40" cy="40" r="3" fill="#0F172A" />
          <path d="M40 40V23M40 40L52 46" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...common}>
          <rect x="24" y="12" width="32" height="56" rx="6" fill="#1E293B" />
          <rect x="28" y="18" width="24" height="40" rx="2" fill="#38BDF8" />
          <circle cx="40" cy="63" r="2.5" fill="#94A3B8" />
        </svg>
      );
    case 'umbrella':
      return (
        <svg {...common}>
          <path d="M14 40C14 24 26 14 40 14C54 14 66 24 66 40H14Z" fill="#6366F1" />
          <path d="M40 40V60C40 64 37 66 34 66C31 66 29 64 29 61" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
          <path d="M40 10V14" stroke="#4F46E5" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'shirt':
      return (
        <svg {...common}>
          <path d="M26 16L12 26L18 36L25 32V64H55V32L62 36L68 26L54 16L46 21H34L26 16Z" fill="#0EA5E9" />
          <path d="M33 16C35 22 45 22 47 16" stroke="#0369A1" strokeWidth="3" />
        </svg>
      );
    case 'shoes':
      return (
        <svg {...common}>
          <path d="M16 46C16 36 24 30 32 30L42 40H56C63 40 68 45 68 51V55H16V46Z" fill="#7C3AED" />
          <rect x="14" y="55" width="56" height="6" rx="3" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
        </svg>
      );
    case 'key':
      return (
        <svg {...common}>
          <circle cx="27" cy="40" r="12" stroke="#D97706" strokeWidth="5" fill="#FEF3C7" />
          <path d="M39 40H66M55 40V49M63 40V47" stroke="#D97706" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );
    case 'dog':
      return (
        <svg {...common}>
          <ellipse cx="20" cy="36" rx="7" ry="14" fill="#92400E" />
          <ellipse cx="60" cy="36" rx="7" ry="14" fill="#92400E" />
          <circle cx="40" cy="40" r="20" fill="#D97706" />
          <circle cx="33" cy="36" r="3" fill="#0F172A" />
          <circle cx="47" cy="36" r="3" fill="#0F172A" />
          <ellipse cx="40" cy="46" rx="5" ry="3.5" fill="#0F172A" />
        </svg>
      );
    case 'cat':
      return (
        <svg {...common}>
          <path d="M22 30L20 14L34 24H46L60 14L58 30" fill="#F97316" />
          <circle cx="40" cy="44" r="19" fill="#FB923C" />
          <circle cx="33" cy="40" r="2.8" fill="#0F172A" />
          <circle cx="47" cy="40" r="2.8" fill="#0F172A" />
          <polygon points="37,47 43,47 40,50" fill="#BE185D" />
        </svg>
      );
    case 'fish':
      return (
        <svg {...common}>
          <ellipse cx="36" cy="40" rx="22" ry="14" fill="#06B6D4" />
          <polygon points="56,40 70,28 70,52" fill="#0891B2" />
          <circle cx="24" cy="37" r="3" fill="#0F172A" />
          <path d="M36 30C42 36 42 44 36 50" stroke="#CFFAFE" strokeWidth="2.5" />
        </svg>
      );
    case 'egg':
      return (
        <svg {...common}>
          <path d="M40 14C28 14 21 32 21 46C21 58 29 66 40 66C51 66 59 58 59 46C59 32 52 14 40 14Z" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2.5" />
          <ellipse cx="33" cy="32" rx="4" ry="8" transform="rotate(-15 33 32)" fill="#FFFFFF" opacity="0.7" />
        </svg>
      );
    case 'bread':
      return (
        <svg {...common}>
          <path d="M16 36C16 24 26 20 40 20C54 20 64 24 64 36V56C64 60 61 62 56 62H24C19 62 16 60 16 56V36Z" fill="#D97706" />
          <path d="M26 30L34 38M40 28L48 36M52 32L56 38" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'coffee':
      return (
        <svg {...common}>
          <path d="M20 34H54V50C54 58 47 64 37 64C27 64 20 58 20 50V34Z" fill="#78350F" />
          <path d="M54 38H60C63 38 65 41 65 44C65 48 63 50 60 50H54" stroke="#78350F" strokeWidth="4" />
          <path d="M28 24C28 19 32 19 32 14M38 24C38 19 42 19 42 14M48 24C48 19 52 19 52 14" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...common}>
          <path d="M40 64C40 64 14 48 14 30C14 21 21 15 29 15C34 15 38 18 40 22C42 18 46 15 51 15C59 15 66 21 66 30C66 48 40 64 40 64Z" fill="#E11D48" />
        </svg>
      );
    case 'eye':
      return (
        <svg {...common}>
          <path d="M12 40C20 26 30 22 40 22C50 22 60 26 68 40C60 54 50 58 40 58C30 58 20 54 12 40Z" fill="#F8FAFC" stroke="#0F172A" strokeWidth="3" />
          <circle cx="40" cy="40" r="10" fill="#0284C7" />
          <circle cx="40" cy="40" r="4.5" fill="#0F172A" />
        </svg>
      );
    case 'tooth':
      return (
        <svg {...common}>
          <path d="M24 20C18 20 16 28 18 38C20 48 23 64 29 64C34 64 36 52 40 52C44 52 46 64 51 64C57 64 60 48 62 38C64 28 62 20 56 20C50 20 45 23 40 23C35 23 30 20 24 20Z" fill="#F8FAFC" stroke="#64748B" strokeWidth="3" />
        </svg>
      );
    case 'orange':
      return (
        <svg {...common}>
          <circle cx="40" cy="44" r="21" fill="#F97316" />
          <path d="M40 23C43 17 48 15 52 17C48 21 44 23 40 23Z" fill="#22C55E" />
          <circle cx="33" cy="36" r="2" fill="#FED7AA" />
        </svg>
      );
    case 'banana':
      return (
        <svg {...common}>
          <path d="M20 52C34 60 56 50 62 22C56 36 38 46 20 44C17 44 17 50 20 52Z" fill="#FACC15" stroke="#CA8A04" strokeWidth="2" />
        </svg>
      );
    case 'hospital':
      return (
        <svg {...common}>
          <rect x="18" y="18" width="44" height="48" rx="4" fill="#F8FAFC" stroke="#64748B" strokeWidth="2.5" />
          <rect x="35" y="27" width="10" height="22" rx="1.5" fill="#DC2626" />
          <rect x="29" y="33" width="22" height="10" rx="1.5" fill="#DC2626" />
          <rect x="33" y="54" width="14" height="12" fill="#0284C7" />
        </svg>
      );
    case 'bed':
      return (
        <svg {...common}>
          <rect x="14" y="38" width="52" height="14" rx="3" fill="#2563EB" />
          <rect x="18" y="31" width="14" height="7" rx="3" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
          <path d="M14 26V58M66 36V58" stroke="#78350F" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );
    case 'bag':
      return (
        <svg {...common}>
          <path d="M30 24V19C30 15 34 13 40 13C46 13 50 15 50 19V24" stroke="#78350F" strokeWidth="4" />
          <rect x="16" y="24" width="48" height="38" rx="6" fill="#0D9488" />
          <rect x="16" y="36" width="48" height="5" fill="#115E59" />
        </svg>
      );
    default:
      return null;
  }
};
