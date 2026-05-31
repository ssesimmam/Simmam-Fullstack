export const HOUSE_DEPARTMENTS = {
  AGNIYAS: ['Aerospace', 'Biotech', 'Chemical'],
  DHRONAS: ['Civil', 'Computer Science', 'IT'],
  MARUTAS: ['ECE', 'EEE', 'Instrumentation'],
  RUDRAS: ['Mechanical', 'Mechatronics', 'Automobile'],
  SURYAS: ['AIML', 'Data Science', 'CSE'],
  VAJRAS: ['Physics', 'Maths', 'Chemistry'],
} as const

type HouseKey = keyof typeof HOUSE_DEPARTMENTS

const normalizeHouseKey = (house: string) => house.trim().toUpperCase().replace(/[^A-Z]/g, '')

export function getDepartmentsForHouse(house: string): string[] {
  const normalizedHouse = normalizeHouseKey(house)
  return [...(HOUSE_DEPARTMENTS[normalizedHouse as HouseKey] ?? [])]
}

export function isValidDepartmentForHouse(house: string, department: string) {
  return getDepartmentsForHouse(house).includes(department.trim())
}