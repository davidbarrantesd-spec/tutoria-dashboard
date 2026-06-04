export default function LoadingScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-5">
        <div className="w-14 h-14 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
        <div className="text-center">
          <p className="font-semibold text-slate-600 text-sm">Sistema de Tutoría</p>
          <p className="text-xs text-slate-400 mt-1">Universidad Peruana Unión</p>
        </div>
      </div>
    </div>
  )
}
