// client/src/hooks/usePublicConfig.ts
import { useQuery } from '@tanstack/react-query';


type Institution = {
  id: number | string;
  name: string;
};
type Awards = {
  id: number | string;
  name: string;
};

type PublicConfig = {
  institutions: Institution[];
  awards: Awards[];
  courses: string[];
};

export const usePublicConfig = () => {
  return useQuery<PublicConfig>({
    queryKey: ['/api/public/config'],
    queryFn: async () => {
      const res = await fetch('/api/public/config');
      if (!res.ok) throw new Error('Failed to fetch config');
      return res.json();
    },
  });
};
