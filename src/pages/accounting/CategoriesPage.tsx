import React, { useState, useEffect } from 'react';
import { fetchCategories, createCategory, Category } from '../../api/accounting';
import { useForm } from 'react-hook-form';
import { Loader, AlertCircle, PlusCircle } from 'lucide-react';

const CategoriesPage: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { register, handleSubmit, reset, formState: { errors } } = useForm<Partial<Category>>();

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const fetchedCategories = await fetchCategories();
            setCategories(fetchedCategories);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: Partial<Category>) => {
        try {
            const newCategory = await createCategory(data);
            setCategories([...categories, newCategory]);
            reset();
        } catch (err: any) {
            setError(err.message || 'Failed to create category');
        }
    };

    const incomeCategories = categories.filter(c => c.type === 'income');
    const expenseCategories = categories.filter(c => c.type === 'expense');

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Categories</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-bold text-green-700 mb-4">Income Categories</h2>
                            {loading ? <Loader className="animate-spin" /> : (
                                <ul className="space-y-2">
                                    {incomeCategories.map(cat => (
                                        <li key={cat._id} className="p-3 bg-green-50 rounded-lg">{cat.name}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-bold text-red-700 mb-4">Expense Categories</h2>
                             {loading ? <Loader className="animate-spin" /> : (
                                <ul className="space-y-2">
                                    {expenseCategories.map(cat => (
                                        <li key={cat._id} className="p-3 bg-red-50 rounded-lg">{cat.name}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Category</h2>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                            <input type="text" id="name" {...register('name', { required: 'Name is required' })} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
                            <select id="type" {...register('type', { required: 'Type is required' })} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                            {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea id="description" {...register('description')} rows={3} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"></textarea>
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <PlusCircle className="mr-2" />
                            Create Category
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CategoriesPage;
