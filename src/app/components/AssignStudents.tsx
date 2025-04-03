import { useState, useEffect } from "react";
import { toast } from "react-toastify";

interface Student {
  _id: string;
  name: string;
}

interface Instructor {
  _id: string;
  name: string;
}

const AssignStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState("");

  useEffect(() => {
    const fetchData = async (endpoint: string, setter: (data: any[]) => void) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Unauthorized - No token found");

        const res = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch data");
        }

        const data = await res.json();
        setter(data);
      } catch (err: any) {
        toast.error(err.message);
      }
    };

    fetchData("/api/unassigned-students", setStudents);
    fetchData("/api/instructors", setInstructors);
  }, []);

  const handleAssign = async () => {
    if (!selectedStudent || !selectedInstructor) {
      toast.error("Please select both a student and an instructor");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized - No token found");

      const res = await fetch("/api/assign-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentId: selectedStudent, instructorId: selectedInstructor }),
      });

      if (!res.ok) {
        throw new Error("Failed to assign student");
      }

      toast.success("Student assigned successfully!");
      setSelectedStudent("");
      setSelectedInstructor("");
      setStudents((prev) => prev.filter((student) => student._id !== selectedStudent));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="mt-6 p-6 bg-white shadow-lg rounded-lg border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Assign Students</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Select Student</label>
          <select
        value={selectedStudent}
        onChange={(e) => setSelectedStudent(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
      >
        <option value="">Choose a student...</option>
        {students.map((student) => (
          <option key={student._id} value={student._id}>{student.name}</option>
        ))}
      </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Select Instructor</label>
          <select
            value={selectedInstructor}
            onChange={(e) => setSelectedInstructor(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <option value="">Choose an instructor...</option>
            {instructors.map((instructor) => (
              <option key={instructor._id} value={instructor._id}>{instructor.name}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={handleAssign}
        className="mt-6 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium"
      >
        Assign Student
      </button>
    </div>
  );
};

export default AssignStudents;
