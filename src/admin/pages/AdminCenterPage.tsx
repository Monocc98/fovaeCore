import { Shield, Users, KeyRound, CalendarRange, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/auth/store/auth.store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOutletContext } from "react-router";
import { AdminCompanyFiscalPanel, AdminUsersPanel } from "@/admin/components";
import type { OutletContext as HomeOutletContext } from "@/home/layouts/HomeLayoutV2";

const modules = [
  {
    title: "Usuarios",
    description: "Alta, baja, edicion y permisos de usuarios STANDARD.",
    icon: Users,
    accent: "blue",
  },
  {
    title: "Permisos",
    description: "Edicion completa de companyPermissions y accesos por cuenta.",
    icon: KeyRound,
    accent: "amber",
  },
  {
    title: "Anos Fiscales",
    description: "Espacio listo para conectar CRUD de periodos fiscales.",
    icon: CalendarRange,
    accent: "emerald",
  },
  {
    title: "Configuracion Sensible",
    description: "Reserva para reglas y parametros de alto impacto.",
    icon: AlertTriangle,
    accent: "rose",
  },
] as const;

const palette = {
  blue: "bg-slate-50 border-slate-100 text-slate-900",
  amber: "bg-amber-50 border-amber-100 text-amber-900",
  emerald: "bg-emerald-50 border-emerald-100 text-emerald-900",
  rose: "bg-rose-50 border-rose-100 text-rose-900",
} as const;

export const AdminCenterPage = () => {
  const { user } = useAuthStore();
  const { overlay } = useOutletContext<HomeOutletContext>();

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-rose-200 bg-gradient-to-r from-rose-50 to-slate-100 px-8 py-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-primary">
                  <Shield className="h-3.5 w-3.5" />
                  SOLO SUPER ADMIN
                </div>
                <h1 className="text-3xl font-semibold tracking-tight">Admin Center</h1>
                <p className="mt-3 text-sm text-slate-600">
                  Panel central para operaciones sensibles. El modulo de usuarios ya
                  esta conectado al backend administrativo nuevo.
                </p>
              </div>

              <div className="rounded-2xl border border-rose-100 bg-white/70 px-5 py-4 text-sm text-slate-700">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Sesion Actual
                </div>
                <div className="mt-2 font-medium text-slate-950">{user?.name ?? "Super Admin"}</div>
                <div className="text-slate-600">{user?.email ?? ""}</div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="users" className="p-8">
            <TabsList className="h-auto w-full justify-start gap-2 rounded-2xl bg-slate-100 p-1">
              <TabsTrigger value="users" className="rounded-xl px-4 py-2">
                Usuarios
              </TabsTrigger>
              <TabsTrigger value="fiscal" className="rounded-xl px-4 py-2">
                Configuracion Fiscal
              </TabsTrigger>
              <TabsTrigger value="overview" className="rounded-xl px-4 py-2">
                Resumen
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-6">
              <AdminUsersPanel overlay={overlay} />
            </TabsContent>

            <TabsContent value="fiscal" className="mt-6">
              <AdminCompanyFiscalPanel overlay={overlay} />
            </TabsContent>

            <TabsContent value="overview" className="mt-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_320px]">
                <div className="grid gap-5 md:grid-cols-2">
                  {modules.map((module) => {
                    const Icon = module.icon;
                    return (
                      <article
                        key={module.title}
                        className={`rounded-2xl border p-5 ${palette[module.accent]}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="rounded-2xl bg-white/70 p-3">
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
                            Disponible
                          </span>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">{module.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {module.description}
                        </p>
                      </article>
                    );
                  })}
                </div>

                <aside className="space-y-5">
                  <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Estado Actual
                    </h2>
                    <div className="mt-4 space-y-3 text-sm text-slate-700">
                      <p>Usuarios y permisos ya consumen los endpoints nuevos.</p>
                      <p>Anos fiscales y configuracion sensible quedan listos para la siguiente fase.</p>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Reglas
                    </h2>
                    <div className="mt-4 space-y-3 text-sm text-slate-700">
                      <div className="rounded-xl bg-slate-100 px-4 py-3">
                        Solo SUPER_ADMIN puede entrar por UI o URL.
                      </div>
                      <div className="rounded-xl bg-slate-100 px-4 py-3">
                        El editor de permisos siempre envia el set completo.
                      </div>
                    </div>
                  </section>
                </aside>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  );
};
