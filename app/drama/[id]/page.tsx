import AppShell from '@/app/AppShell';

interface DramaPageProps {
  params: {
    id: string;
  };
}

export default function DramaPage({ params }: DramaPageProps) {
  return <AppShell initialDramaId={params.id} />;
}
