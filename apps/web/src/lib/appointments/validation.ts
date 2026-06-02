export function todayIsoDate() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function computePetAgeLabel(birthDate: string | null | undefined): string {
  if (!birthDate) return "—";
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years > 0) return years === 1 ? "1 ano" : `${years} anos`;
  if (months > 0) return months === 1 ? "1 mês" : `${months} meses`;
  return "Recém-nascido";
}

export function validateClientAppointmentForm(data: {
  petId: string;
  serviceType: string;
  attendanceMode: string;
  scheduledDate: string;
  scheduledTime: string;
  tutorName: string;
  tutorPhone: string;
  tutorEmail: string;
}) {
  const errors: Record<string, string> = {};

  if (!data.tutorName.trim()) errors.tutorName = "Informe o nome do tutor.";
  if (!data.tutorEmail.trim()) errors.tutorEmail = "Informe o e-mail.";
  if (!data.tutorPhone.trim()) errors.tutorPhone = "Informe o telefone.";
  if (!data.petId) errors.petId = "Selecione um pet cadastrado.";
  if (!data.serviceType) errors.serviceType = "Selecione o serviço.";
  if (!data.attendanceMode) errors.attendanceMode = "Selecione a forma de atendimento.";
  if (!data.scheduledDate) errors.scheduledDate = "Informe a data.";
  if (!data.scheduledTime) errors.scheduledTime = "Informe o horário.";

  if (data.scheduledDate) {
    const chosen = new Date(`${data.scheduledDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (chosen < today) {
      errors.scheduledDate = "Não é possível agendar para datas passadas.";
    }
  }

  return errors;
}
