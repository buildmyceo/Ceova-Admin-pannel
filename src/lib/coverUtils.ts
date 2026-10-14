/**
 * Resolves a cover image URL, routing Supabase Storage through the same-origin proxy
 * to prevent campus/corporate DNS filters (like Cisco Umbrella) from blocking it.
 */
export function resolveCoverUrl(url?: string | null): string {
  if (!url || !url.trim()) return '';
  const trimmed = url.trim();
  if (trimmed.includes('supabase.co/storage/')) {
    const parts = trimmed.split('/storage/');
    if (parts[1]) {
      return `/supabase-storage/${parts[1]}`;
    }
  }
  return trimmed;
}

export interface CoverBannerStyle {
  backgroundImage: string;
  backgroundColor: string;
  isCustom: boolean;
}

export function getMemberCoverStyle(member?: {
  role?: string;
  department?: string;
  cover_url?: string | null;
  full_name?: string | null;
}): CoverBannerStyle {
  const resolved = resolveCoverUrl(member?.cover_url);
  if (resolved) {
    return {
      backgroundImage: `url("${resolved}")`,
      backgroundColor: '#121215',
      isCustom: true
    };
  }

  const role = (member?.role || '').toLowerCase();
  const dept = (member?.department || '').toLowerCase();

  if (role === 'ceo' || role === 'executive' || dept.includes('exec')) {
    return {
      backgroundImage: `radial-gradient(circle at 80% 20%, rgba(212, 175, 55, 0.35) 0%, transparent 55%), radial-gradient(circle at 15% 85%, rgba(180, 83, 9, 0.25) 0%, transparent 60%), linear-gradient(135deg, #1c1917 0%, #09090b 100%)`,
      backgroundColor: '#09090b',
      isCustom: false
    };
  }

  if (role === 'cto' || dept.includes('dev') || dept.includes('tech') || dept.includes('engineer')) {
    return {
      backgroundImage: `radial-gradient(circle at 85% 15%, rgba(59, 130, 246, 0.4) 0%, transparent 55%), radial-gradient(circle at 15% 85%, rgba(99, 102, 241, 0.28) 0%, transparent 50%), linear-gradient(135deg, #0b1120 0%, #050811 100%)`,
      backgroundColor: '#050811',
      isCustom: false
    };
  }

  if (role === 'cmo' || dept.includes('mkt') || dept.includes('market') || dept.includes('design')) {
    return {
      backgroundImage: `radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.35) 0%, transparent 55%), radial-gradient(circle at 20% 80%, rgba(168, 85, 247, 0.28) 0%, transparent 50%), linear-gradient(135deg, #18091f 0%, #0c0510 100%)`,
      backgroundColor: '#0c0510',
      isCustom: false
    };
  }

  if (role === 'coo' || dept.includes('ops') || dept.includes('operation')) {
    return {
      backgroundImage: `radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.32) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(14, 165, 233, 0.25) 0%, transparent 50%), linear-gradient(135deg, #041a15 0%, #020d0b 100%)`,
      backgroundColor: '#020d0b',
      isCustom: false
    };
  }

  if (role === 'cfo' || dept.includes('fin')) {
    return {
      backgroundImage: `radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.32) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(217, 119, 6, 0.25) 0%, transparent 50%), linear-gradient(135deg, #1a1205 0%, #0d0902 100%)`,
      backgroundColor: '#0d0902',
      isCustom: false
    };
  }

  if (role === 'intern') {
    return {
      backgroundImage: `radial-gradient(circle at 85% 20%, rgba(245, 158, 11, 0.28) 0%, transparent 50%), radial-gradient(circle at 15% 80%, rgba(99, 102, 241, 0.3) 0%, transparent 50%), linear-gradient(135deg, #13111c 0%, #09080e 100%)`,
      backgroundColor: '#09080e',
      isCustom: false
    };
  }

  return {
    backgroundImage: `radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.28) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.22) 0%, transparent 50%), linear-gradient(135deg, #12131a 0%, #0a0b0e 100%)`,
    backgroundColor: '#0a0b0e',
    isCustom: false
  };
}
