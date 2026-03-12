export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-red-600">غير مصرح</h1>
        <p className="text-gray-600">ليس لديك صلاحية للوصول إلى هذه الصفحة.</p>
      </div>
    </main>
  );
}
