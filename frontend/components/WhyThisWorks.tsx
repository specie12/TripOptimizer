'use client';

import { parseExplanationToBullets } from '@/lib/formatters';

interface WhyThisWorksProps {
  explanation: string;
}

export default function WhyThisWorks({ explanation }: WhyThisWorksProps) {
  const bullets = parseExplanationToBullets(explanation);

  return (
    <ul className="space-y-2 pb-2">
      {bullets.map((bullet, index) => (
        <li key={index} className="flex items-start">
          <span className="text-green-500 mr-3 mt-0.5">&#8226;</span>
          <span className="text-gray-700">{bullet}</span>
        </li>
      ))}
    </ul>
  );
}
