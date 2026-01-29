import React, { useState, useEffect, useRef } from 'react';
import emailjs from '@emailjs/browser';
import './App.css';
import latestTag from './latestTag.txt';

// Componente de fondo de partículas
const ParticleBackground = ({ theme }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    const colors = theme === 'dark'
      ? [
        'rgba(102, 51, 153, 0.6)',
        'rgba(35, 78, 160, 0.5)',
        'rgba(15, 120, 87, 0.5)',
        'rgba(207, 100, 0, 0.5)'
      ]
      : [
        'rgba(0, 150, 215, 0.4)',
        'rgba(104, 159, 56, 0.4)',
        'rgba(242, 142, 28, 0.4)',
        'rgba(41, 121, 255, 0.4)'
      ];

    let mousePosition = {
      x: null,
      y: null,
      radius: 150
    };

    window.addEventListener('mousemove', (event) => {
      mousePosition.x = event.x;
      mousePosition.y = event.y;
    });

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = (Math.random() * 30) + 1;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.speedFactor = Math.random() * 0.5 + 0.2;
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }

      update() {
        let dx = mousePosition.x - this.x;
        let dy = mousePosition.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) distance = 1;

        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;
        const maxDistance = 100;
        let force = (maxDistance - distance) / maxDistance;

        if (force < 0) force = 0;

        let directionX = (forceDirectionX * force * this.density) * -1;
        let directionY = (forceDirectionY * force * this.density) * -1;

        if (distance < mousePosition.radius) {
          this.x += directionX * this.speedFactor;
          this.y += directionY * this.speedFactor;
        } else {
          if (this.x !== this.baseX) {
            dx = this.x - this.baseX;
            this.x -= dx / 15 * this.speedFactor;
          }
          if (this.y !== this.baseY) {
            dy = this.y - this.baseY;
            this.y -= dy / 15 * this.speedFactor;
          }
        }
        this.draw();
      }
    }

    const particlesArray = [];
    const numberOfParticles = theme === 'dark' ? 70 : 80;

    const init = () => {
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
      }
    };

    init();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
      }
      connectParticles();
      requestAnimationFrame(animate);
    };

    const connectParticles = () => {
      const connectionDistance = theme === 'dark' ? 100 : 120;
      const lineOpacity = theme === 'dark' ? 0.5 : 0.3;

      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          const dx = particlesArray[a].x - particlesArray[b].x;
          const dy = particlesArray[a].y - particlesArray[b].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const lineColor = theme === 'dark'
              ? `rgba(90, 90, 120, ${lineOpacity * (1 - distance / connectionDistance)})`
              : `rgba(100, 149, 237, ${lineOpacity * (1 - distance / connectionDistance)})`;

            ctx.strokeStyle = lineColor;
            ctx.lineWidth = theme === 'dark' ? 0.8 : 0.6;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    };

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      window.removeEventListener('mousemove', (event) => {
        mousePosition.x = event.x;
        mousePosition.y = event.y;
      });
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: theme === 'dark' ? 0.8 : 0.7
      }}
    />
  );
};

function Header({ toggleTheme, theme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const headerClass = `header ${theme}`;
  const navClass = `header-nav ${menuOpen ? 'open' : ''}`;
  const boxClass = `menu-box ${theme}`;

  return (
    <header className={headerClass}>
      <div className="container header-container">
        <div className="header-name">Rodrigo Montenegro</div>
        <nav className={navClass}>
          <ul>
            {['Inicio', 'Sobre mí', 'Proyectos', 'Contacto'].map((item) => (
              <li key={item}>
                <a href={`#${item.toLowerCase().replace(' ', '-')}`} onClick={toggleMenu}>
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <button className="theme-toggle-btn" onClick={toggleTheme}>
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <button className="menu-toggle-btn" onClick={toggleMenu}>
          ☰
        </button>
      </div>
      <div className={boxClass}></div>
    </header>
  );
}

function Home() {
  const [tagContent, setTagContent] = useState('');

  useEffect(() => {
    const fetchTag = async () => {
      try {
        const response = await fetch(latestTag);
        const text = await response.text();
        setTagContent(text);
      } catch (error) {
        console.error('Error al cargar la etiqueta:', error);
      }
    };
    fetchTag();
  }, []);

  return (
    <section id="inicio" className="section home full-height">
      <div className="container home-container">
        <div className="home-content">
          <h1 className="home-title">¡Hola! Soy Rodrigo <span className="wave-emoji">👋</span></h1>
          <h2 className="home-subtitle">Construyendo el futuro con código y automatización</h2>

          <div className="home-description">
            <p>
              Bienvenido a mi mundo tech donde <span className="tech-highlight">Docker</span>,
              <span className="tech-highlight">Kubernetes</span>,
              <span className="tech-highlight">Jenkins</span> y
              <span className="tech-highlight">Linux</span> se combinan para crear
              soluciones ágiles y escalables.
            </p>
            <p>
              Me apasiona automatizar procesos, optimizar infraestructuras y resolver
              desafíos complejos con tecnologías DevOps.
            </p>
          </div>

          <div className="home-actions">
            <a href="#proyectos" className="btn primary-btn">Ver mis proyectos <span className="btn-icon">🚀</span></a>
          </div>
        </div>
      </div>

      {tagContent && (
        <div className="version-tag">
          <p>Versión: {tagContent}</p>
        </div>
      )}
    </section>
  );
}

const experienceData = [
  {
    id: 1,
    company: "Empresa Tecnológica A",
    role: "DevOps Engineer Senior",
    period: "2021 - Presente",
    description: "Liderazgo en la migración de infraestructura a AWS usando Terraform. Implementación de pipelines CI/CD con Jenkins y GitHub Actions reduciendo el time-to-market en un 40%.",
    technologies: ["AWS", "Terraform", "Kubernetes", "Python"]
  },
  {
    id: 2,
    company: "Consultora IT Global",
    role: "SysAdmin / DevOps",
    period: "2018 - 2021",
    description: "Administración de cluster Kubernetes en producción. Automatización de tareas de mantenimiento con Bash y Ansible. Gestión de bases de datos PostgreSQL de alta disponibilidad.",
    technologies: ["Linux", "Ansible", "Docker", "PostgreSQL"]
  },
  {
    id: 3,
    company: "Startup Innovadora",
    role: "Junior Developer & Support",
    period: "2016 - 2018",
    description: "Desarrollo backend con Node.js y soporte a infraestructura cloud. Implementación de monitoreo básico con Nagios.",
    technologies: ["Node.js", "MySQL", "AWS EC2"]
  }
];

function Experience() {
  return (
    <section id="experiencia" className="section experience full-height">
      <div className="container">
        <h2 className="section-title">Experiencia Profesional</h2>
        <div className="experience-container">
          <div className="timeline">
            {experienceData.map((item) => (
              <div key={item.id} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className="timeline-header">
                    <h3>{item.role}</h3>
                    <span className="company-name">@ {item.company}</span>
                    <span className="period">{item.period}</span>
                  </div>
                  <p>{item.description}</p>
                  <div className="tech-tags">
                    {item.technologies.map((tech, i) => (
                      <span key={i} className="tech-tag">{tech}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="resume-download">
            <a href="/imagenes/Rodrigo_Montenegro_CV-3.pdf" download className="btn primary-btn">
              Descargar CV Completo <span className="btn-icon">📄</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function About() {
  const skills = [
    { name: 'Contenedorización y Orquestación', icon: '🐳', description: 'Docker, Kubernetes, gestión de contenedores y clusters' },
    { name: 'CI/CD', icon: '⚙️', description: 'Jenkins, Azure DevOps, automatización de despliegues' },
    { name: 'Monitorización y Alertas', icon: '📊', description: 'Prometheus, Grafana, Nagios, sistemas de alertas proactivas' },
    { name: 'Administración de Bases de Datos', icon: '🗄️', description: 'PostgreSQL, MongoDB, optimización y gestión' },
    { name: 'Scripting y Automatización', icon: '🔧', description: 'Bash, Python, automatización de tareas repetitivas' }
  ];

  return (
    <section id="sobre-mí" className="section about full-height">
      <div className="container">
        <div className="about-container">
          <h2 className="section-title">Sobre mí</h2>

          <div className="about-content">
            <div className="about-text">
              <div className="about-card">
                <p className="about-intro">
                  <span className="highlight">Como Ingeniero DevOps</span> con amplia experiencia en administración de
                  infraestructura y automatización, he desarrollado soluciones robustas para entornos
                  Linux y Kubernetes.
                </p>
                <p>
                  Mi experiencia implementando sistemas CI/CD con Jenkins y Azure DevOps
                  me ha permitido optimizar procesos de desarrollo y despliegue, mejorando
                  significativamente la eficiencia operativa de los equipos de desarrollo.
                </p>
              </div>
            </div>

            <div className="about-image-container">
              <div className="profile-image">
                <img src="/imagenes/profile.png" alt="Rodrigo Montenegro" />
                <div className="image-overlay">
                  <span className="name-badge">Rodrigo Montenegro</span>
                </div>
              </div>
            </div>
          </div>

          <div className="skills-section">
            <h3 className="skills-title">Mis habilidades:</h3>

            <div className="skills-container">
              {skills.map((skill, index) => (
                <div key={index} className="skill-card">
                  <div className="skill-icon">{skill.icon}</div>
                  <h4>{skill.name}</h4>
                  <p>{skill.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProjectDetail({ project, onClose }) {
  return (
    <div className="project-detail">
      <div className="project-detail-header">
        <h3>{project.title}</h3>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      <div className="project-detail-content">
        <div className="project-image">
          <img src={project.image} alt={project.title} />
        </div>

        <div className="project-info">
          <p className="project-description">{project.description}</p>

          <h4>Detalles del proyecto:</h4>
          <ul className="project-details-list">
            <li><span>Tecnologías:</span> {project.technologies}</li>
            <li><span>Duración:</span> {project.duration}</li>
            <li><span>Rol:</span> {project.role}</li>
            {project.results && <li><span>Resultados:</span> {project.results}</li>}
          </ul>

          {project.link && (
            <div className="project-links">
              <a href={project.link} target="_blank" rel="noopener noreferrer" className="project-link">
                Ver Proyecto
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Projects() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [filter, setFilter] = useState('todos');

  const projects = [
    {
      id: 1,
      title: 'Infraestructura Cloud',
      description: 'Implementación de arquitectura escalable en AWS para una plataforma de comercio electrónico. Diseño e infraestructura utilizando contenedores Docker y orquestación con Kubernetes.',
      image: '/imagenes/project_cloud.png',
      technologies: 'Docker, Kubernetes, AWS, Terraform, Jenkins',
      duration: '4 meses',
      role: 'DevOps Engineer',
      results: 'Reducción del 70% en tiempos de despliegue y mejora en disponibilidad a 99.9%',
      category: 'Infraestructura',
      link: '#'
    },
    {
      id: 2,
      title: 'Sistema de Monitoreo',
      description: 'Desarrollo de una plataforma integrada de monitoreo para identificar y resolver problemas en tiempo real. Implementación de alertas proactivas y dashboards personalizados.',
      image: '/imagenes/project_monitoring.png',
      technologies: 'Nagios, Prometheus, Grafana, Linux, Bash',
      duration: '3 meses',
      role: 'Especialista en Sistemas',
      results: 'Reducción del 60% en tiempo de resolución de incidentes',
      category: 'Monitoreo',
      link: '#'
    },
    {
      id: 3,
      title: 'Pipelines CI/CD',
      description: 'Implementación de pipelines automatizados para pruebas y despliegue continuo en múltiples entornos. Incluye aprobaciones configurables y rollbacks automáticos.',
      image: '/imagenes/project_cicd.png',
      technologies: 'Jenkins, Azure DevOps, Docker, Git, SonarQube',
      duration: '6 meses',
      role: 'DevOps Engineer',
      results: 'Reducción del ciclo de entrega de 5 días a menos de 2 horas',
      category: 'DevOps',
      link: '#'
    },
    {
      id: 4,
      title: 'Optimización de Bases de Datos',
      description: 'Mejora de rendimiento y escalabilidad de bases de datos para aplicaciones de alta concurrencia. Implementación de estrategias de indexación y particionamiento.',
      image: '/imagenes/project_database.png',
      technologies: 'PostgreSQL, MongoDB, Redis, SQL, Bash',
      duration: '5 meses',
      role: 'Administrador de BD',
      results: 'Mejora del 80% en rendimiento de consultas críticas',
      category: 'Bases de Datos',
      link: '#'
    },
  ];

  const categories = ['todos', ...new Set(projects.map(project => project.category))];

  const filteredProjects = filter === 'todos'
    ? projects
    : projects.filter(project => project.category === filter);

  return (
    <section id="proyectos" className="section projects full-height">
      <div className="container">
        <h2 className="section-title">Proyectos</h2>
        <p className="section-subtitle">
          Estos proyectos demuestran mi experiencia en infraestructura, automatización y desarrollo de soluciones DevOps.
        </p>

        <div className="filter-container">
          {categories.map(category => (
            <button
              key={category}
              className={`filter-btn ${filter === category ? 'active' : ''}`}
              onClick={() => setFilter(category)}
            >
              {category === 'todos' ? 'Todos' : category}
            </button>
          ))}
        </div>

        <div className="projects-grid">
          {filteredProjects.map(project => (
            <div
              key={project.id}
              className="project-card"
              onClick={() => setSelectedProject(project)}
            >
              <div className="project-image-container">
                <img src={project.image} alt={project.title} />
                <div className="project-overlay">
                  <span className="view-details">Ver detalles</span>
                </div>
              </div>
              <div className="project-content">
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div className="tech-tags">
                  {project.technologies.split(', ').slice(0, 3).map((tech, i) => (
                    <span key={i} className="tech-tag">{tech}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedProject && (
          <div className="modal">
            <div className="modal-content">
              <ProjectDetail project={selectedProject} onClose={() => setSelectedProject(null)} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// Componente de contacto modernizado
function Contact() {
  const [formData, setFormData] = useState({
    from_name: '',
    from_email: '',
    message: ''
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({
    ...formData,
    [e.target.name]: e.target.value
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('Enviando...');

    const dataToSend = {
      ...formData,
      reply_to: formData.from_email
    };

    try {
      const result = await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        dataToSend,
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      );

      console.log('Resultado:', result);
      setStatus('¡Mensaje enviado correctamente!');
      setFormData({ from_name: '', from_email: '', message: '' });
    } catch (error) {
      console.error('Error al enviar el mensaje:', error);
      setStatus('Error al enviar el mensaje. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contacto" className="section contact full-height">
      <div className="container">
        <div className="contact-container">
          <h2 className="section-title">Conectemos 🚀</h2>

          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-card">
                <h3 className="contact-subtitle">💬 ¡Hablemos de tu proyecto!</h3>
                <p className="contact-text">
                  ¿Necesitas optimizar tu infraestructura? ¿Implementar CI/CD?
                  ¿Mejorar la estabilidad de tus sistemas?
                </p>
                <p className="contact-text">
                  Con experiencia en <span className="highlight">DevOps, Kubernetes, Docker y Cloud</span>,
                  puedo ayudarte a transformar tus procesos y llevar tu
                  infraestructura al siguiente nivel.
                </p>

                <div className="contact-methods">
                  <div className="contact-method">
                    <div className="contact-icon">📧</div>
                    <div>
                      <div className="contact-label">Email</div>
                      <div className="contact-value">rodrigo@montecno.dev</div>
                    </div>
                  </div>
                  <div className="contact-method">
                    <div className="contact-icon">📱</div>
                    <div>
                      <div className="contact-label">Teléfono</div>
                      <div className="contact-value">+56 9 1234 5678</div>
                    </div>
                  </div>
                  <div className="contact-method">
                    <div className="contact-icon">💼</div>
                    <div>
                      <div className="contact-label">LinkedIn</div>
                      <div className="contact-value">linkedin.com/in/rodrigo-montenegro</div>
                    </div>
                  </div>
                  <div className="contact-method">
                    <div className="contact-icon">🐙</div>
                    <div>
                      <div className="contact-label">GitHub</div>
                      <div className="contact-value">github.com/rodrigomontenegro</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-form-container">
              <div className="form-card">
                <h3 className="form-title">Envíame un mensaje</h3>
                <form onSubmit={handleSubmit} className="contact-form">
                  <InputField
                    label="Nombre"
                    name="from_name"
                    value={formData.from_name}
                    handleChange={handleChange}
                  />
                  <InputField
                    label="Correo electrónico"
                    name="from_email"
                    value={formData.from_email}
                    handleChange={handleChange}
                  />
                  <TextAreaField
                    label="Mensaje"
                    name="message"
                    value={formData.message}
                    handleChange={handleChange}
                  />
                  <button
                    type="submit"
                    className={`btn submit-btn ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? 'Enviando...' : 'Enviar mensaje'}
                  </button>

                  {status && (
                    <div className={`form-status ${status.includes('Error') ? 'error' : 'success'}`}>
                      {status}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InputField({ label, name, value, handleChange }) {
  return (
    <div className="form-group">
      <label htmlFor={name}>{label}:</label>
      <input
        type={name === 'from_email' || name === 'reply_to' ? 'email' : 'text'}
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={`Ingresa tu ${label.toLowerCase()}`}
        required
      />
    </div>
  );
}

function TextAreaField({ label, name, value, handleChange }) {
  return (
    <div className="form-group">
      <label htmlFor={name}>{label}:</label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={`Escribe tu ${label.toLowerCase()}`}
        rows="5"
        required
      />
    </div>
  );
}

function Footer({ theme }) {
  const footerClass = `footer ${theme}`;
  return (
    <footer className={footerClass}>
      <div className="container footer-container">
        <p> &copy; {new Date().getFullYear()} Rodrigo Montenegro. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

function App() {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return (
    <div className={`app ${theme}`}>
      <ParticleBackground theme={theme} />
      <div className="content-wrapper" style={{ position: 'relative', zIndex: 1 }}>
        <Header toggleTheme={toggleTheme} theme={theme} />
        <Home />
        <About />
        <Experience />
        <Projects />
        <Contact />
        <Footer theme={theme} />
      </div>
    </div>
  );
}

export default App;
