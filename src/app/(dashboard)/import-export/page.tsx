import { requireAuth } from "@/lib/auth/guard";
import { ImportSection } from "./import-section";
import { ExportSection } from "./export-section";

export default async function ImportExportPage() {
  await requireAuth("staff");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الاستيراد والتصدير</h1>
        <p className="mt-1 text-sm text-gray-500">
          استيراد وتصدير بيانات المستفيدين
        </p>
      </div>

      <ImportSection />
      <ExportSection />
    </div>
  );
}
