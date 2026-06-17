"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

const palette = ["#0f766e", "#2563eb", "#dc2626", "#d97706", "#7c3aed", "#059669", "#475569", "#0891b2"];

export function DashboardCharts({
  categoryData,
  budgetVsActual,
  historyData
}: {
  categoryData: { name: string; actual: number; budgeted: number }[];
  budgetVsActual: { name: string; presupuesto: number; real: number }[];
  historyData: { label: string; ingresos: number; gastos: number; ahorro: number }[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Gastos por categoría</CardTitle>
          <CardDescription>Distribución del gasto real del periodo.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Pie data={categoryData} dataKey="actual" innerRadius={58} nameKey="name" outerRadius={96} paddingAngle={2}>
                {categoryData.map((entry, index) => (
                  <Cell fill={palette[index % palette.length]} key={entry.name} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Presupuesto vs real</CardTitle>
          <CardDescription>Comparación por categoría.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={budgetVsActual}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="presupuesto" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="real" fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tendencia mensual</CardTitle>
          <CardDescription>Ingresos reales, gastos y ahorro aportado.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Line dataKey="ingresos" stroke="#2563eb" strokeWidth={2} type="monotone" />
              <Line dataKey="gastos" stroke="#dc2626" strokeWidth={2} type="monotone" />
              <Line dataKey="ahorro" stroke="#0f766e" strokeWidth={2} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export function CashflowChart({
  data
}: {
  data: {
    name: string;
    ingresoQ1: number;
    gastoQ1: number;
    deudaQ1: number;
    restoQ1: number;
    ingresoQ2: number;
    gastoQ2: number;
    deudaQ2: number;
    restoQ2: number;
  }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Flujo quincenal</CardTitle>
        <CardDescription>Ingresos, gastos y resto por quincena.</CardDescription>
      </CardHeader>
      <CardContent className="h-96">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Bar dataKey="ingresoQ1" fill="#2563eb" name="Ingreso Q1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gastoQ1" fill="#dc2626" name="Gasto Q1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="deudaQ1" fill="#f97316" name="Deuda Q1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="restoQ1" fill="#0f766e" name="Resto Q1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ingresoQ2" fill="#7c3aed" name="Ingreso Q2" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gastoQ2" fill="#d97706" name="Gasto Q2" radius={[4, 4, 0, 0]} />
            <Bar dataKey="deudaQ2" fill="#be123c" name="Deuda Q2" radius={[4, 4, 0, 0]} />
            <Bar dataKey="restoQ2" fill="#0891b2" name="Resto Q2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
