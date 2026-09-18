import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
export default function OrderConfirmation() {
  const { id } = useParams();
  return (
    <Layout>
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <div className="card p-10">
          <div className="text-5xl">✓</div>
          <h1 className="font-serif text-4xl font-bold mt-4">Order placed</h1>
          <p className="text-ink-soft mt-2">
            Your order is now in the NutriSphere tracking flow.
          </p>
          <Link to={`/orders/${id}`} className="btn-primary mt-6">
            Track order
          </Link>
        </div>
      </div>
    </Layout>
  );
}
