import { Card } from "@/components/ui/Card";

type Airport = {
  name: string;
  price: string;
};

type PreviewCardProps = {
  data?: {
    destination?: string;
    price?: string;
    description?: string;
    advantages?: string[];
    airports?: Airport[];
  };
};

export default function PreviewCard({ data }: PreviewCardProps) {
  if (!data) return null;

  return (
    <Card className="space-y-5">

      {/* Destination */}
      <div>
        <h2 className="text-2xl font-semibold">
          {data.destination ?? "Missing destination"}
        </h2>
        <p className="text-gray-600">
          {data.price ?? "No price detected"}
        </p>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-700">
        {data.description ?? "No description found"}
      </p>

      {/* Advantages */}
      <div>
        <h3 className="font-medium mb-2">Advantages</h3>

        {(data.advantages?.length ?? 0) > 0 ? (
          <ul className="space-y-1">
            {data.advantages!.map((a, i) => (
              <li key={i}>✔ {a}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-sm">No advantages detected</p>
        )}
      </div>

      {/* Airports */}
      <div>
        <h3 className="font-medium mb-2">Airports</h3>

        {(data.airports?.length ?? 0) > 0 ? (
          <div className="space-y-2">
            {data.airports!.map((a, i) => (
              <div
                key={i}
                className="flex justify-between text-sm bg-gray-50 p-2 rounded-lg"
              >
                <span>{a.name}</span>
                <span>{a.price}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No airport data</p>
        )}
      </div>

    </Card>
  );
}