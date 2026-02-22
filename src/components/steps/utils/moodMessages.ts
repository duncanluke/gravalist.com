export const getMoodMessage = (moodId: string): React.ReactNode => {
  switch (moodId) {
    case 'excited':
      return <><strong>Amazing energy!</strong> Channel that excitement into your ride. You're going to have an incredible experience.</>;
    case 'confident':
      return <><strong>Perfect mindset!</strong> Confidence comes from preparation, and you've done the work. Trust yourself.</>;
    case 'calm':
      return <><strong>Beautiful composure.</strong> This calm energy will serve you well throughout your journey.</>;
    case 'nervous':
      return <><strong>Nerves are normal.</strong> Those butterflies show you care. Take deep breaths and trust your preparation.</>;
    case 'unsure':
      return <><strong>Uncertainty is okay.</strong> Remember why you're here. You've prepared for this moment. You're ready.</>;
    case 'overwhelmed':
      return <><strong>Take a breath.</strong> Break it down: you have everything you need. Focus on the next step, not the whole journey.</>;
    default:
      return null;
  }
};