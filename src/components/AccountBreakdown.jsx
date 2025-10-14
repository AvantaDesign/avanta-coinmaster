import { formatCurrency } from '../utils/calculations';

export default function AccountBreakdown({ accounts }) {
  if (!accounts || accounts.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
        No hay cuentas para mostrar
      </div>
    );
  }

  // Group accounts by type
  const accountsByType = accounts.reduce((acc, account) => {
    if (!acc[account.type]) {
      acc[account.type] = [];
    }
    acc[account.type].push(account);
    return acc;
  }, {});

  // Calculate totals
  const totalBalance = accounts.reduce((sum, acc) => {
    return sum + (acc.type === 'banco' ? acc.balance : -acc.balance);
  }, 0);

  const typeLabels = {
    banco: 'Bancos',
    tarjeta: 'Tarjetas de Crédito',
    efectivo: 'Efectivo'
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">Desglose por Cuenta</h3>
      
      <div className="space-y-4">
        {Object.entries(accountsByType).map(([type, accts]) => (
          <div key={type} className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {typeLabels[type] || type}
            </h4>
            
            {accts.map((account) => {
              const displayBalance = account.type === 'banco' ? account.balance : -account.balance;
              const isPositive = displayBalance >= 0;
              
              return (
                <div key={account.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {account.name}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(Math.abs(displayBalance))}
                      </div>
                    </div>
                    
                    {/* Visual bar */}
                    <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ 
                          width: `${Math.min(100, (Math.abs(displayBalance) / Math.abs(totalBalance)) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        
        {/* Total section */}
        <div className="pt-4 border-t-2 border-gray-300">
          <div className="flex items-center justify-between">
            <div className="text-base font-bold text-gray-900">
              Balance Total
            </div>
            <div className={`text-lg font-bold ${
              totalBalance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(totalBalance)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
