import React, { useEffect, useState } from 'react';
import { getFichasTecnicas } from '../services/fichaTecnicaService';
import { FichaTecnica } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { CheckCircle, XCircle } from 'lucide-react';

export const FichasTecnicasPage: React.FC = () => {
  const [fichas, setFichas] = useState<FichaTecnica[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFichasTecnicas().then(setFichas).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Fichas Técnicas</h1>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Fichas Técnicas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">OF</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Veículo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Placa</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Chassi</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Lucirlene</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Izabelly</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Kilder</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fichas.map(ficha => (
                  <tr key={ficha.id}>
                    <td className="px-4 py-2">{ficha.orderNumber ?? ficha.order_number}</td>
                    <td className="px-4 py-2">{ficha.cliente}</td>
                    <td className="px-4 py-2">{ficha.veiculo}</td>
                    <td className="px-4 py-2">{ficha.placa}</td>
                    <td className="px-4 py-2">{ficha.chassi}</td>
                    <td className="px-4 py-2 text-center">
                      {ficha.visto_lucirlene ? <CheckCircle className="text-green-600 inline" /> : <XCircle className="text-gray-400 inline" />}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {ficha.visto_izabelly ? <CheckCircle className="text-green-600 inline" /> : <XCircle className="text-gray-400 inline" />}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {ficha.visto_kilder ? <CheckCircle className="text-green-600 inline" /> : <XCircle className="text-gray-400 inline" />}
                    </td>
                    <td className="px-4 py-2">{ficha.created_at ? new Date(ficha.created_at).toLocaleDateString('pt-BR') : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
