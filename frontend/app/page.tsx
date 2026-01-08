import TripInputForm from '@/components/TripInputForm';

export default function Home() {
  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Plan your next trip
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Tell us where you&apos;re coming from, your budget, and we&apos;ll
          find destinations that work for you.
        </p>
      </div>

      <TripInputForm />
    </div>
  );
}
