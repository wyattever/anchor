FROM php:8.2-apache

# Set Apache document root to /var/www/html/public
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Configure Apache to listen on port 8080 (Cloud Run requirement)
RUN sed -i 's/Listen 80/Listen 8080/' /etc/apache2/ports.conf
RUN sed -i 's/:80/:8080/' /etc/apache2/sites-available/*.conf

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Install pdo_mysql extension
RUN docker-php-ext-install pdo_mysql

# Copy application files
COPY . /var/www/html

# Expose port 8080
EXPOSE 8080

# Cloud Run expects the container to start the web server
CMD ["apache2-foreground"]
