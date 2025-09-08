import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { PlusCircle, Loader } from 'lucide-react';
import { fetchCategories, createTransaction, Category, OfficeTransaction } from '../../api/accounting';
import { useBranch } from '../../context/BranchContext';

interface CreateTransactionFormProps {
    onTransactionCreated: (transaction: OfficeTransaction) => void;
}

const CreateTransactionForm: React.FC<CreateTransactionFormProps> = ({ onTransactionCreated }) => {
    const { register, handleSubmit, control, watch, formState: { errors }, reset } = useForm<Partial<OfficeTransaction>>();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { currentBranch } = useBranch();

    const transactionType = watch('type');

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const fetchedCategories = await fetchCategories();
                setCategories(fetchedCategories);
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };
        loadCategories();
    }, []);

    const onSubmit = async (data: Partial<OfficeTransaction>) => {
        setLoading(true);
        setError(null);
        try {
            const transactionData = {
                ...data,
                branch: currentBranch?._id,
                amount: Number(data.amount)
            };
            const newTransaction = await createTransaction(transactionData);
            onTransactionCreated(newTransaction);
            reset();
        } catch (err: any) {
            setError(err.message || 'Failed to create transaction');
        } finally {
            setLoading(false);
        }
    };

    const filteredCategories = categories.filter(c => c.type === transactionType);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 bg-white rounded-lg shadow-md space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Create New Transaction</h2>

            <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
                <Controller
                    name="type"
                    control={control}
                    defaultValue="income"
                    render={({ field }) => (
                        <select {...field} id="type" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    )}
                />
            </div>

            <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">Category</label>
                <Controller
                    name="categoryId"
                    control={control}
                    rules={{ required: 'Category is required' }}
                    render={({ field }) => (
                        <select {...field} id="categoryId" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                            <option value="">Select a category</option>
                            {filteredCategories.map(cat => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                        </select>
                    )}
                />
                {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
            </div>

            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
                <input type="number" id="amount" {...register('amount', { required: 'Amount is required', valueAsNumber: true })} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
            </div>

            <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                <input type="date" id="date" {...register('date', { required: 'Date is required' })} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea id="description" {...register('description')} rows={3} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"></textarea>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400">
                {loading ? <Loader className="animate-spin" /> : <PlusCircle className="mr-2" />}
                Create Transaction
            </button>
        </form>
    );
};

export default CreateTransactionForm;
