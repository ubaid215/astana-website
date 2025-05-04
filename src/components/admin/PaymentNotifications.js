export default function PaymentNotifications({ notifications }) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold text-secondary mb-4">Payment Notifications</h2>
        {notifications.length > 0 ? (
          <ul className="space-y-4">
            {notifications.map((n, index) => (
              <li key={index} className="border-b pb-2">
                <p className="text-gray-600">
                  <strong>{n.userName}</strong> submitted payment for Participation ID:{' '}
                  <strong>{n.participationId}</strong>
                </p>
                <p className="text-gray-600">Transaction ID: {n.transactionId}</p>
                {n.screenshot && (
                  <p>
                    <a href={n.screenshot} target="_blank" className="text-blue-600 hover:underline">
                      View Screenshot
                    </a>
                  </p>
                )}
                <p className="text-gray-500 text-sm">{new Date(n.timestamp).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No payment notifications yet</p>
        )}
      </div>
    );
  }