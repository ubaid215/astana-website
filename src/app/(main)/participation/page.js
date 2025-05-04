import ParticipationForm from '@/components/forms/ParticipationForm';

export const metadata = {
  title: 'Participate - Eid ul Adha Participation System',
  description: 'Submit your participation details for Eid ul Adha with our easy-to-use form.',
  keywords: 'Eid ul Adha, participation, qurbani, form, submit',
};

export default function ParticipationPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12">
      <ParticipationForm />
    </div>
  );
}