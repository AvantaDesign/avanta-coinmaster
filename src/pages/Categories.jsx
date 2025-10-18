import CategoryManager from '../components/CategoryManager';

export default function Categories() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 dark:text-white">Categorías Personalizadas</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Crea y gestiona categorías personalizadas para clasificar tus transacciones
        </p>
      </div>
      
      <CategoryManager />
    </div>
  );
}
