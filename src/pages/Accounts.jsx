import AccountManager from '../components/AccountManager';

export default function Accounts() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Cuentas Bancarias</h1>
        <p className="text-gray-600">
          Gestiona tus cuentas bancarias, tarjetas de crédito y efectivo
        </p>
      </div>
      
      <AccountManager />
    </div>
  );
}
