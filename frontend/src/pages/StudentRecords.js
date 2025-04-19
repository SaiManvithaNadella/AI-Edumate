// src/pages/StudentRecords.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './StudentRecords.css';

const StudentRecords = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '',
    subject: '',
    grade_level: '',
    academic_year: '',
    description: ''
  });
  const [newStudent, setNewStudent] = useState({
    student_name: '',
    student_id: '',
    notes: ''
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/classes');
      setClasses(response.data);
      
      // Select the first class by default if available
      if (response.data.length > 0) {
        setSelectedClass(response.data[0]);
        fetchStudents(response.data[0].id);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError('Failed to load classes. Please try again later.');
      setIsLoading(false);
    }
  };

  const fetchStudents = async (classId) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/classes/${classId}/students`);
      setStudents(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students. Please try again later.');
      setIsLoading(false);
    }
  };

  const handleClassChange = (classId) => {
    const selectedClass = classes.find(c => c.id === parseInt(classId));
    setSelectedClass(selectedClass);
    fetchStudents(classId);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleNewClassChange = (e) => {
    const { name, value } = e.target;
    setNewClass(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNewStudentChange = (e) => {
    const { name, value } = e.target;
    setNewStudent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleAddClass = () => {
    setIsAddingClass(!isAddingClass);
  };

  const toggleAddStudent = () => {
    setIsAddingStudent(!isAddingStudent);
  };

  const submitNewClass = async (e) => {
    e.preventDefault();
    
    try {
      const response = await api.post('/classes', newClass);
      setClasses([...classes, response.data]);
      setNewClass({
        name: '',
        subject: '',
        grade_level: '',
        academic_year: '',
        description: ''
      });
      setIsAddingClass(false);
      
      // Select the newly created class
      setSelectedClass(response.data);
      fetchStudents(response.data.id);
    } catch (error) {
      console.error('Error creating class:', error);
      setError('Failed to create class. Please try again.');
    }
  };

  const submitNewStudent = async (e) => {
    e.preventDefault();
    
    if (!selectedClass) {
      setError('Please select a class before adding a student.');
      return;
    }
    
    try {
      const studentData = {
        ...newStudent,
        class_id: selectedClass.id
      };
      
      const response = await api.post('/student-records', studentData);
      setStudents([...students, response.data]);
      setNewStudent({
        student_name: '',
        student_id: '',
        notes: ''
      });
      setIsAddingStudent(false);
    } catch (error) {
      console.error('Error adding student:', error);
      setError('Failed to add student. Please try again.');
    }
  };

  const deleteStudent = async (id) => {
    if (window.confirm('Are you sure you want to delete this student record?')) {
      try {
        await api.delete(`/student-records/${id}`);
        setStudents(students.filter(student => student.id !== id));
      } catch (error) {
        console.error('Error deleting student:', error);
        setError('Failed to delete student. Please try again.');
      }
    }
  };

  const deleteClass = async (id) => {
    if (window.confirm('Are you sure you want to delete this class? All student records in this class will also be deleted.')) {
      try {
        await api.delete(`/classes/${id}`);
        setClasses(classes.filter(c => c.id !== id));
        
        // If the deleted class was selected, select another one if available
        if (selectedClass && selectedClass.id === id) {
          const remainingClasses = classes.filter(c => c.id !== id);
          if (remainingClasses.length > 0) {
            setSelectedClass(remainingClasses[0]);
            fetchStudents(remainingClasses[0].id);
          } else {
            setSelectedClass(null);
            setStudents([]);
          }
        }
      } catch (error) {
        console.error('Error deleting class:', error);
        setError('Failed to delete class. Please try again.');
      }
    }
  };

  // Filter students based on search query
  const filteredStudents = students.filter(student => 
    student.student_name.toLowerCase().includes(search.toLowerCase()) ||
    student.student_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="student-records-page">
      <header className="page-header">
        <h2>Student Records</h2>
        <div className="header-actions">
          <button className="add-btn" onClick={toggleAddStudent} disabled={!selectedClass}>
            <i className="fas fa-user-plus"></i> Add Student
          </button>
          <button className="add-btn add-class-btn" onClick={toggleAddClass}>
            <i className="fas fa-plus"></i> Add Class
          </button>
        </div>
      </header>
      
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i> {error}
          <button className="close-btn" onClick={() => setError(null)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      
      {isAddingClass && (
        <div className="add-class-form">
          <h3>Add New Class</h3>
          <form onSubmit={submitNewClass}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Class Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newClass.name}
                  onChange={handleNewClassChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <select
                  id="subject"
                  name="subject"
                  value={newClass.subject}
                  onChange={handleNewClassChange}
                  required
                >
                  <option value="">Select Subject</option>
                  <option value="Math">Math</option>
                  <option value="Science">Science</option>
                  <option value="Social Studies">Social Studies</option>
                  <option value="English">English</option>
                  <option value="Art">Art</option>
                  <option value="Music">Music</option>
                  <option value="Physical Education">Physical Education</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Foreign Language">Foreign Language</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="grade_level">Grade Level</label>
                <select
                  id="grade_level"
                  name="grade_level"
                  value={newClass.grade_level}
                  onChange={handleNewClassChange}
                  required
                >
                  <option value="">Select Grade</option>
                  <option value="K">Kindergarten</option>
                  <option value="1">1st Grade</option>
                  <option value="2">2nd Grade</option>
                  <option value="3">3rd Grade</option>
                  <option value="4">4th Grade</option>
                  <option value="5">5th Grade</option>
                  <option value="6">6th Grade</option>
                  <option value="7">7th Grade</option>
                  <option value="8">8th Grade</option>
                  <option value="9">9th Grade</option>
                  <option value="10">10th Grade</option>
                  <option value="11">11th Grade</option>
                  <option value="12">12th Grade</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="academic_year">Academic Year</label>
                <input
                  type="text"
                  id="academic_year"
                  name="academic_year"
                  placeholder="e.g., 2023-2024"
                  value={newClass.academic_year}
                  onChange={handleNewClassChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                name="description"
                rows="3"
                value={newClass.description}
                onChange={handleNewClassChange}
              ></textarea>
            </div>
            
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={toggleAddClass}>
                Cancel
              </button>
              <button type="submit" className="save-btn">
                Save Class
              </button>
            </div>
          </form>
        </div>
      )}
      
      {isAddingStudent && selectedClass && (
        <div className="add-student-form">
          <h3>Add New Student to {selectedClass.name}</h3>
          <form onSubmit={submitNewStudent}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="student_name">Student Name</label>
                <input
                  type="text"
                  id="student_name"
                  name="student_name"
                  value={newStudent.student_name}
                  onChange={handleNewStudentChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="student_id">Student ID (Optional)</label>
                <input
                  type="text"
                  id="student_id"
                  name="student_id"
                  value={newStudent.student_id}
                  onChange={handleNewStudentChange}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="notes">Notes (Optional)</label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                value={newStudent.notes}
                onChange={handleNewStudentChange}
              ></textarea>
            </div>
            
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={toggleAddStudent}>
                Cancel
              </button>
              <button type="submit" className="save-btn">
                Add Student
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="student-records-content">
        <div className="classes-sidebar">
          <h3>My Classes</h3>
          {classes.length > 0 ? (
            <ul className="classes-list">
              {classes.map(cls => (
                <li 
                  key={cls.id} 
                  className={selectedClass && selectedClass.id === cls.id ? 'active' : ''}
                  onClick={() => handleClassChange(cls.id)}
                >
                  <div className="class-info">
                    <h4>{cls.name}</h4>
                    <div className="class-details">
                      <span>{cls.subject}</span>
                      <span>Grade {cls.grade_level}</span>
                    </div>
                  </div>
                  <button 
                    className="delete-class-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteClass(cls.id);
                    }}
                    title="Delete Class"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-classes">
              <p>No classes created yet.</p>
              <button className="btn" onClick={toggleAddClass}>
                Create Your First Class
              </button>
            </div>
          )}
        </div>
        
        <div className="students-content">
          {selectedClass ? (
            <>
              <div className="students-header">
                <h3>{selectedClass.name} - Students</h3>
                <div className="search-box">
                  <i className="fas fa-search"></i>
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={search}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>
              
              {isLoading ? (
                <div className="loading">Loading students...</div>
              ) : (
                <>
                  {filteredStudents.length > 0 ? (
                    <div className="students-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Student ID</th>
                            <th>Notes</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map(student => (
                            <tr key={student.id}>
                              <td>{student.student_name}</td>
                              <td>{student.student_id || 'N/A'}</td>
                              <td className="notes-cell">
                                {student.notes || 'No notes available'}
                              </td>
                              <td className="actions-cell">
                                <button 
                                  className="action-btn edit-btn"
                                  title="Edit Student"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button 
                                  className="action-btn delete-btn"
                                  onClick={() => deleteStudent(student.id)}
                                  title="Delete Student"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-students">
                      <i className="fas fa-user-graduate"></i>
                      <h4>No Students Found</h4>
                      <p>
                        {students.length === 0
                          ? "This class doesn't have any students yet."
                          : "No students match your search."}
                      </p>
                      {students.length === 0 && (
                        <button className="btn" onClick={toggleAddStudent}>
                          Add Your First Student
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="no-class-selected">
              <i className="fas fa-chalkboard-teacher"></i>
              <h3>No Class Selected</h3>
              <p>Please select a class from the sidebar or create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentRecords;