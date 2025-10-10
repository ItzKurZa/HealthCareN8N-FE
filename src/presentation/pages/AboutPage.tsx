import { Heart, Award, Target, Users } from 'lucide-react';

export const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">About HealthCare Plus</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Dedicated to providing exceptional healthcare services with compassion,
            innovation, and excellence since 1995
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              At HealthCare Plus, we are committed to delivering world-class healthcare
              services that prioritize patient well-being above all else. Our mission is
              to make quality healthcare accessible, affordable, and patient-centered.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We believe in treating the whole person, not just the illness. Our
              integrated approach combines cutting-edge medical technology with
              compassionate care to ensure the best possible outcomes for our patients.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Vision</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We envision a future where healthcare is seamlessly integrated into daily
              life, where prevention is as important as treatment, and where every
              individual has access to the care they need.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Through continuous innovation, education, and community engagement, we
              strive to be the healthcare provider of choice in our region and beyond.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Compassion</h3>
            <p className="text-gray-600">
              We care deeply about every patient and their family
            </p>
          </div>

          <div className="text-center">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Excellence</h3>
            <p className="text-gray-600">
              Striving for the highest standards in everything we do
            </p>
          </div>

          <div className="text-center">
            <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Innovation</h3>
            <p className="text-gray-600">
              Embracing new technologies and methods for better care
            </p>
          </div>

          <div className="text-center">
            <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Community</h3>
            <p className="text-gray-600">
              Building healthier communities through partnership
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Our Departments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              'Cardiology',
              'Neurology',
              'Pediatrics',
              'Orthopedics',
              'General Medicine',
              'Dermatology',
              'Emergency Care',
              'Radiology',
              'Laboratory Services',
            ].map((dept) => (
              <div key={dept} className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-800 font-medium">{dept}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">By the Numbers</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-8">
            <div>
              <p className="text-4xl font-bold text-blue-600">28+</p>
              <p className="text-gray-600 mt-2">Years of Service</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-600">150+</p>
              <p className="text-gray-600 mt-2">Medical Professionals</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-600">50K+</p>
              <p className="text-gray-600 mt-2">Patients Served Annually</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-600">9</p>
              <p className="text-gray-600 mt-2">Specialized Departments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
