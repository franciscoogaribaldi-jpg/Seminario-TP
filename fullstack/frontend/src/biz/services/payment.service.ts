import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/payments`;

export interface SubPayment {
  id: number;
  amount: number;
  payment_date: string;
  payment_method?: string;
  status: string;
}

export interface Installment {
  id: number | string;
  id_enrollment?: number;
  id_course?: number;
  course_name?: string;
  section?: string;
  id_academic_year?: number;
  academic_year_name?: string;
  year?: number;
  installment_month: string;
  amount: number;
  total_paid: number;
  remaining_amount: number;
  due_date: string;
  status: 'Pagado' | 'Parcial' | 'Pendiente' | 'Paid' | 'Partial' | 'Pending' | string;
  payment_date: string | null;
  payment_method?: string;
  payments?: SubPayment[];
  surcharge?: number;
  discount?: number;
  paymentMethod?: string;
}

export interface RegisterPaymentPayload {
  id_enrollment: number;
  installment_month: string;
  amount: number;
  payment_method: string;
  payment_date?: string;
  surcharge?: number;
  discount?: number;
  status?: string;
}

export interface AccountStatus {
  enrollments: any[];
  installments: Installment[];
}

export interface Debtor {
  id: number;
  fullName: string;
  dni: string;
  email?: string;
  phone?: string;
  course: string;
  course_name?: string;
  academic_year?: string;
  id_academic_year?: number;
  id_enrollment?: number;
  unpaidInstallments: number;
  unpaidMonths?: string[];
  monthlyFee?: number;
  totalDebt: number;
}

export const paymentService = {
  getAllPayments: async (): Promise<any[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error al obtener los pagos');
    const json = await response.json();
    return json.data || [];
  },

  getStudentAccountStatus: async (idUser: number, idAcademicYear?: number): Promise<AccountStatus> => {
    const url = idAcademicYear 
      ? `${API_URL}/student/${idUser}?id_academic_year=${idAcademicYear}` 
      : `${API_URL}/student/${idUser}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al obtener el estado de cuenta');
    const json = await response.json();
    return json.data || { enrollments: [], installments: [] };
  },

  registerPayment: async (payload: RegisterPaymentPayload): Promise<any> => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(json.message || 'No se pudo procesar el pago.');
    }
    return json.data;
  },

  getDebtors: async (idAcademicYear?: number): Promise<Debtor[]> => {
    const url = idAcademicYear 
      ? `${API_URL}/debtors?id_academic_year=${idAcademicYear}` 
      : `${API_URL}/debtors`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al obtener los deudores');
    const json = await response.json();
    return json.data || [];
  },
};
