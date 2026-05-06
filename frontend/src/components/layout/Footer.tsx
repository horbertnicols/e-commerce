export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-semibold mb-4">关于我们</h3>
            <p className="text-sm">
              E-Shop 是一个现代化的电商平台，提供优质商品和服务。
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">快速链接</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/products" className="hover:text-white">全部商品</a></li>
              <li><a href="/cart" className="hover:text-white">购物车</a></li>
              <li><a href="/orders" className="hover:text-white">我的订单</a></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-white font-semibold mb-4">帮助中心</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">购物指南</a></li>
              <li><a href="#" className="hover:text-white">支付方式</a></li>
              <li><a href="#" className="hover:text-white">配送说明</a></li>
              <li><a href="#" className="hover:text-white">售后服务</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">联系我们</h3>
            <ul className="space-y-2 text-sm">
              <li>客服热线：400-123-4567</li>
              <li>服务时间：9:00 - 21:00</li>
              <li>邮箱：support@eshop.com</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} E-Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
