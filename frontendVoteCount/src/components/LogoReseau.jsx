import logoImg from '@assets/img/logo.png';
const LogoReseau = ({
    size = 'sm',
    Image
}) => {

    const sizeClasses = {
        sm: 'w-[32px] h-[36px]',
        md: 'w-[45px] h-[50px]',
        lg: 'w-[56px] h-[63px]',
    };

    return (
        <div className={`${sizeClasses[size]} flex  items-center justify-center transition-transform duration-200 group-hover:scale-105`}>
            <img
                src={Image ? Image : logoImg}
                alt={Image ? Image : logoImg}
                className="w-full h-full rounded-full object-contain "
            />
        </div>
    );
};

export default LogoReseau;
