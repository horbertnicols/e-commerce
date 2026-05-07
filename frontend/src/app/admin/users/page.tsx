'use client';

import { useEffect, useState } from 'react';
import { useAdminUserStore } from '@/stores/admin/userStore';
import Table, { TableColumn } from '@/components/admin/Table';
import Pagination from '@/components/admin/Pagination';
import StatusBadge from '@/components/admin/StatusBadge';
import Modal from '@/components/admin/Modal';
import Button from '@/components/ui/Button';
import { Trash2 } from 'lucide-react';
import type { AdminUser, Role } from '@/types/admin';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const {
    users,
    total,
    page,
    pageSize,
    totalPages,
    loading,
    fetchUsers,
    updateUserRole,
    deleteUser,
    setPage,
    setPageSize,
  } = useAdminUserStore();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [userToChangeRole, setUserToChangeRole] = useState<AdminUser | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleClick = (user: AdminUser) => {
    setUserToChangeRole(user);
    setRoleModalOpen(true);
  };

  const handleRoleChange = async () => {
    if (!userToChangeRole) return;
    const newRole: Role = userToChangeRole.role === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await updateUserRole(userToChangeRole.id, newRole);
      toast.success('角色更新成功');
      setRoleModalOpen(false);
      setUserToChangeRole(null);
    } catch {
      toast.error('角色更新失败');
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id);
      toast.success('用户已删除');
      setDeleteModalOpen(false);
      setUserToDelete(null);
    } catch {
      toast.error('删除失败');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const columns: TableColumn<AdminUser>[] = [
    {
      key: 'avatar',
      header: '头像',
      width: '60px',
      render: (user) =>
        user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
            {user.name.charAt(0)}
          </div>
        ),
    },
    {
      key: 'name',
      header: '用户名',
      render: (user) => <span className="font-medium">{user.name}</span>,
    },
    {
      key: 'email',
      header: '邮箱',
      render: (user) => <span className="text-gray-500">{user.email}</span>,
    },
    {
      key: 'phone',
      header: '手机号',
      render: (user) => (
        <span className="text-gray-500">{user.phone || '-'}</span>
      ),
    },
    {
      key: 'role',
      header: '角色',
      render: (user) => (
        <StatusBadge
          type="role"
          status={user.role}
          onClick={() => handleRoleClick(user)}
        />
      ),
    },
    {
      key: 'createdAt',
      header: '注册时间',
      render: (user) => (
        <span className="text-sm text-gray-500">{formatDate(user.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (user) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setUserToDelete(user);
            setDeleteModalOpen(true);
          }}
          className="p-1 text-gray-500 hover:text-red-600"
          title="删除用户"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
        <p className="mt-1 text-sm text-gray-500">管理系统用户和权限</p>
      </div>

      <Table
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="暂无用户"
        getRowId={(user) => user.id}
      />

      {totalPages > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      <Modal
        isOpen={roleModalOpen}
        onClose={() => {
          setRoleModalOpen(false);
          setUserToChangeRole(null);
        }}
        title="修改用户角色"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setRoleModalOpen(false);
                setUserToChangeRole(null);
              }}
            >
              取消
            </Button>
            <Button onClick={handleRoleChange}>确认修改</Button>
          </>
        }
      >
        <p className="text-gray-600">
          确定要将用户 <strong>{userToChangeRole?.name}</strong> 的角色从{' '}
          <strong>{userToChangeRole?.role === 'ADMIN' ? '管理员' : '普通用户'}</strong>{' '}
          修改为{' '}
          <strong>{userToChangeRole?.role === 'ADMIN' ? '普通用户' : '管理员'}</strong>{' '}
          吗？
        </p>
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        title="确认删除"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setUserToDelete(null);
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
          确定要删除用户 <strong>{userToDelete?.name}</strong> 吗？
          此操作将删除该用户的所有数据，无法恢复。
        </p>
      </Modal>
    </div>
  );
}
