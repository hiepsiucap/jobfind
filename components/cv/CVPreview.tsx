import { forwardRef } from 'react';
import { CV } from '@/types';
import { formatDate } from '@/lib/utils';
import { Mail, Phone, MapPin, Linkedin, Globe, Briefcase, GraduationCap, Award, Languages, FolderGit2, ExternalLink } from 'lucide-react';

interface CVPreviewProps {
  cv: CV;
}

const CVPreview = forwardRef<HTMLDivElement, CVPreviewProps>(({ cv }, ref) => {
  return (
    <div ref={ref} className="bg-white rounded-lg shadow-sm p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b-2 border-blue-600 pb-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {cv.personalInfo.fullName}
        </h1>
        <div className="flex flex-wrap gap-3 text-gray-600 text-sm">
          <div className="flex items-center space-x-1.5">
            <Mail className="h-3.5 w-3.5" />
            <span>{cv.personalInfo.email}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Phone className="h-3.5 w-3.5" />
            <span>{cv.personalInfo.phone}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span>{cv.personalInfo.location}</span>
          </div>
          {cv.personalInfo.linkedin && (
            <div className="flex items-center space-x-1.5">
              <Linkedin className="h-3.5 w-3.5" />
              <span>{cv.personalInfo.linkedin}</span>
            </div>
          )}
          {cv.personalInfo.portfolio && (
            <div className="flex items-center space-x-1.5">
              <Globe className="h-3.5 w-3.5" />
              <span>{cv.personalInfo.portfolio}</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Professional Summary
        </h2>
        <p className="text-gray-700 text-sm leading-relaxed">
          {cv.personalInfo.summary}
        </p>
      </div>

      {/* Experience */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
          Work Experience
        </h2>
        <div className="space-y-4">
          {cv.experience.map((exp) => (
            <div key={exp.id} className="border-l-2 border-blue-600 pl-3">
              <div className="flex justify-between items-start mb-1.5">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {exp.position}
                  </h3>
                  <p className="text-sm text-gray-700 font-medium">{exp.company}</p>
                </div>
                <div className="text-xs text-gray-600 text-right">
                  <div>{exp.location}</div>
                  <div>
                    {formatDate(exp.startDate)} -{' '}
                    {exp.current ? 'Present' : formatDate(exp.endDate!)}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-1.5">{exp.description}</p>
              <ul className="list-disc list-inside space-y-0.5">
                {exp.achievements.map((achievement, index) => (
                  <li key={index} className="text-xs text-gray-600">
                    {achievement}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Education */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <GraduationCap className="h-5 w-5 mr-2 text-blue-600" />
          Education
        </h2>
        <div className="space-y-3">
          {cv.education.map((edu) => (
            <div key={edu.id} className="border-l-2 border-blue-600 pl-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {edu.degree} in {edu.field}
                  </h3>
                  <p className="text-sm text-gray-700 font-medium">{edu.institution}</p>
                </div>
                <div className="text-xs text-gray-600 text-right">
                  <div>{edu.location}</div>
                  <div>
                    {formatDate(edu.startDate)} - {formatDate(edu.endDate!)}
                  </div>
                  {edu.gpa && <div>GPA: {edu.gpa}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Projects */}
      {cv.projects && cv.projects.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <FolderGit2 className="h-5 w-5 mr-2 text-orange-600" />
            Projects
          </h2>
          <div className="space-y-3">
            {cv.projects.map((project) => (
              <div key={project.id} className="border-l-2 border-orange-600 pl-3">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      {project.name}
                      {project.url && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </h3>
                    {project.role && (
                      <p className="text-sm text-gray-700 font-medium">{project.role}</p>
                    )}
                  </div>
                  {project.duration && (
                    <div className="text-xs text-gray-600">{project.duration}</div>
                  )}
                </div>
                <p className="text-sm text-gray-700 mb-1.5">{project.description}</p>
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {project.technologies.map((tech, idx) => (
                      <span
                        key={idx}
                        className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                {project.achievements && project.achievements.length > 0 && (
                  <ul className="list-disc list-inside space-y-0.5">
                    {project.achievements.map((achievement, index) => (
                      <li key={index} className="text-xs text-gray-600">
                        {achievement}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Skills</h2>
        <div className="flex flex-wrap gap-1.5">
          {cv.skills.map((skill, index) => (
            <span
              key={index}
              className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Certifications */}
      {cv.certifications && cv.certifications.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Award className="h-5 w-5 mr-2 text-blue-600" />
            Certifications
          </h2>
          <div className="space-y-2">
            {cv.certifications.map((cert) => (
              <div key={cert.id} className="border-l-2 border-blue-600 pl-3">
                <h3 className="text-sm font-semibold text-gray-900">{cert.name}</h3>
                <p className="text-xs text-gray-600">
                  {cert.issuer} • {formatDate(cert.date)}
                  {cert.credentialId && ` • ID: ${cert.credentialId}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {cv.languages && cv.languages.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Languages className="h-5 w-5 mr-2 text-blue-600" />
            Languages
          </h2>
          <div className="flex flex-wrap gap-3">
            {cv.languages.map((lang, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <span className="font-medium text-gray-900">{lang.name}</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-600 capitalize">
                  {lang.proficiency}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

CVPreview.displayName = 'CVPreview';

export default CVPreview;
