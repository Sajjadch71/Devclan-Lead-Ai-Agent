import { query } from "@/lib/db";
import AvailabilityForm from "@/components/AvailabilityForm";
import AvailabilityExceptionForm from "@/components/AvailabilityExceptionForm";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const rules = await query<any>(
    `select * from availability_rules order by day_of_week, start_time`
  );
  const exceptions = await query<any>(
    `select * from availability_exceptions where date >= current_date order by date`
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Availability</h1>
        <p className="text-base-500 text-sm mt-1">
          The AI agent only offers times inside these windows when booking calls.
        </p>
      </div>

      <div className="card p-6">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
          Weekly hours
        </h2>
        <AvailabilityForm rules={rules} />
      </div>

      <div className="card p-6">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
          Blocked dates
        </h2>
        <AvailabilityExceptionForm exceptions={exceptions} />
      </div>
    </div>
  );
}
