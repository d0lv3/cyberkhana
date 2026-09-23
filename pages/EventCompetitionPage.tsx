import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

// Keep previously shared event URLs working with the common competition screens.
export default function EventCompetitionPage() {
  const { id } = useParams();
  return <Navigate to={`/competition/${id}`} replace />;
}
