'use client';

import { useEffect, useState } from 'react';
import { useAdminCategoryStore } from '@/stores/admin/categoryStore';
import Table, { TableColumn } from '@/components/admin/Table';
import Modal from '@/components/admin/Modal';
import CategoryForm from '@/components/admin/CategoryForm';
import Button from '@/components/ui/Button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Category } from '@/types';
import type { CreateCategoryDto, UpdateCategoryDto } from '@/types/admin';
import toast from 'react-hot-toast';

export default function AdminCategoriesPage() {
  const {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useAdminCategoryStore();

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = () => {
    setEditingCategory(null);
    setFormModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormModalOpen(true);
  };

  const handleSubmit = async (data: CreateCategoryDto | UpdateCategoryDto) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
        toast.success('分类更新成功');
      } else {
        await createCategory(data as CreateCategoryDto);
        toast.success('分类创建成功');
      }
      setFormModalOpen(false);
      setEditingCategory(null);
    } catch {
      toast.error(editingCategory ? '更新失败' : '创建失败');
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete.id);
      toast.success('分类已删除');
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch {
      toast.error('删除失败，可能存在关联商品');
    }
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return '-';
    const parent = categories.find((c) => c.id === parentId);
    return parent?.name || '-';
  };

  const columns: TableColumn<Category>[] = [
    {
      key: 'image',
      header: '图片',
      width: '80px',
      render: (category) =>
        category.image ? (
          <img
            src={category.image}
            alt={category.name}
            className="w-12 h-12 object-cover rounded"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
            无图
          </div>
        ),
    },
    {
      key: 'name',
      header: '分类名称',
      render: (category) => (
        <span className="font-medium">{category.name}</span>
      ),
    },
    {
      key: 'description',
      header: '描述',
      render: (category) => (
        <span className="text-gray-500 text-sm">
          {category.description || '-'}
        </span>
      ),
    },
    {
      key: 'parentId',
      header: '父级分类',
      render: (category) => getParentName(category.parentId),
    },
    {
      key: 'sort',
      header: '排序',
    },
    {
      key: 'actions',
      header: '操作',
      render: (category) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(category);
            }}
            className="p-1 text-gray-500 hover:text-primary-600"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCategoryToDelete(category);
              setDeleteModalOpen(true);
            }}
            className="p-1 text-gray-500 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">分类管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理商品分类</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-5 h-5 mr-2" />
          添加分类
        </Button>
      </div>

      <Table
        columns={columns}
        data={categories}
        loading={loading}
        emptyMessage="暂无分类"
        getRowId={(category) => category.id}
      />

      <Modal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingCategory(null);
        }}
        title={editingCategory ? '编辑分类' : '添加分类'}
        size="md"
      >
        <CategoryForm
          initialData={editingCategory || undefined}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormModalOpen(false);
            setEditingCategory(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCategoryToDelete(null);
        }}
        title="确认删除"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setCategoryToDelete(null);
              }}
            >
              取消
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              确认删除
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          确定要删除分类 <strong>{categoryToDelete?.name}</strong> 吗？
          如果该分类下有商品，将无法删除。
        </p>
      </Modal>
    </div>
  );
}
